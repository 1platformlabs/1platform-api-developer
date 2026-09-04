#!/usr/bin/env node
/**
 * Compuerta de dependencias: bloquea ante advisories CRITICAL en el árbol de
 * PRODUCCIÓN, avisa ante HIGH, y —esto es el punto— dice cuándo NO pudo medir.
 *
 * Uso:
 *   pnpm audit --prod --json > audit.json || true
 *   node scripts/audit-critical.mjs audit.json
 *   node scripts/audit-critical.mjs --self-test
 *
 * ── Por qué un script y no `pnpm audit --audit-level=critical` a secas ──────
 *
 * Porque el código de salida NO distingue "encontré vulnerabilidades" de "no
 * pude alcanzar el servicio de advisories". Medido el 2026-09-04 con pnpm
 * 10.34.5 —la versión que declara `packageManager`, que es la que instala
 * `pnpm/action-setup` en el runner— sobre este mismo repositorio:
 *
 *   pnpm audit --prod --json                              → exit 1, informe con veredicto
 *   pnpm audit --prod --json --registry http://127.0.0.1:9/ → exit 1, {"error":{"code":"ECONNREFUSED",…}}
 *   pnpm audit --prod --json --registry https://example.com/ → exit 1, {"error":{"code":"ERR_PNPM_AUDIT_BAD_RESPONSE",…}}
 *   (árbol sin vulnerabilidades)                          → exit 0, contadores en cero
 *
 * O sea: los dos desenlaces malos salen 1 y sólo se distinguen por la FORMA del
 * JSON. Un `if ! pnpm audit …; then echo "vulnerabilidades"; fi` reporta un
 * registro caído como si fuera un hallazgo de seguridad — y al revés, el día que
 * alguien "arregle" ese falso rojo con un `|| true`, la compuerta deja de
 * proteger nada sin que se note.
 *
 * ── Formas medidas (pnpm 10.34.5) ───────────────────────────────────────────
 *
 *   veredicto: { actions: [], advisories: { "<id>": { severity, module_name,
 *                title, github_advisory_id, vulnerable_versions,
 *                patched_versions, findings: [{ version, paths: [...] }] } },
 *                muted: [], metadata: { vulnerabilities: { info, low, moderate,
 *                high, critical }, dependencies, totalDependencies } }
 *   fallo:     { error: { code, message } }
 *
 * NO se copió `audit-critical.mjs` de `1platform-dashboard`: su respaldo lee
 * `package-lock.json` usando los marcadores `dev`/`devOptional` de npm, y acá el
 * lockfile es `pnpm-lock.yaml` (YAML, otra estructura). Este script no tiene
 * respaldo por eso: sin un parser de YAML no hay forma de reconstruir el
 * conjunto de paquetes de producción sin agregar una dependencia sólo para el
 * CI. La consecuencia se acepta explícita: una auditoría que no puede correr
 * BLOQUEA, y lo dice con su propio mensaje.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWLIST = '.audit-allowlist.json';

/**
 * La ruta del informe viene de `process.argv`, así que decide qué archivo abre
 * este proceso. Se la mantiene dentro del repositorio: ni un caller ni un
 * agente editando el workflow pueden apuntar la compuerta a `/etc/…` o a un
 * checkout hermano y que lea eso en su lugar. `resolve` además normaliza los
 * `..`.
 */
function rutaDelRepo(candidata) {
  const raiz = resolve(process.cwd());
  const destino = resolve(raiz, candidata);
  if (destino !== raiz && !destino.startsWith(raiz + sep)) {
    throw new Error(`la ruta del informe se sale del repositorio: ${candidata}`);
  }
  return destino;
}

/** Excepciones documentadas y con fecha de vencimiento. Ausente = lista vacía. */
function excepciones(hoy) {
  const vigentes = new Map();
  const vencidas = [];
  if (!existsSync(ALLOWLIST)) return { vigentes, vencidas };
  let datos;
  try {
    datos = JSON.parse(readFileSync(ALLOWLIST, 'utf8'));
  } catch (err) {
    // Un allowlist ilegible NO se interpreta como "sin excepciones": eso
    // convertiría un archivo roto en un cambio silencioso de política.
    throw new Error(`${ALLOWLIST} no se pudo leer: ${err.message}`);
  }
  for (const e of datos.excepciones ?? []) {
    if (!e?.id || !e?.motivo || !e?.vence) {
      throw new Error(`${ALLOWLIST}: toda excepción necesita id, motivo y vence`);
    }
    if (e.vence < hoy) vencidas.push(e);
    else vigentes.set(e.id, e);
  }
  return { vigentes, vencidas };
}

/**
 * Lee el informe y devuelve el veredicto, o `null` si NO hay veredicto que
 * leer — que es el caso que este script existe para separar del otro.
 */
function veredicto(rutaInforme) {
  // Fuera del try: una ruta que se sale del repositorio es un caller roto, no
  // un informe ausente, y no debe tragarse como "no pude medir".
  const destino = rutaDelRepo(rutaInforme);
  let informe;
  try {
    informe = JSON.parse(readFileSync(destino, 'utf8'));
  } catch (err) {
    return { motivo: `el informe ${rutaInforme} no se pudo leer ni parsear: ${err.message}` };
  }
  if (informe?.error) {
    const { code, message } = informe.error;
    // El mensaje se recorta: cuando el endpoint contesta HTML, pnpm lo pega
    // ENTERO —dos veces, el principal y el de respaldo— y el motivo real queda
    // sepultado bajo 1,4 KB de markup (medido contra `--registry https://example.com/`).
    const breve = String(message ?? '').replace(/\s+/g, ' ').slice(0, 300);
    return { motivo: `pnpm audit no pudo consultar el servicio de advisories (${code}): ${breve}` };
  }
  if (!informe?.metadata?.vulnerabilities) {
    return { motivo: `el informe ${rutaInforme} no trae metadata.vulnerabilities: no hay veredicto que leer` };
  }
  const contadores = informe.metadata.vulnerabilities;
  const criticas = Object.values(informe.advisories ?? {})
    .filter((a) => a.severity === 'critical')
    .map((a) => ({
      id: a.github_advisory_id ?? String(a.id),
      paquete: a.module_name,
      rango: a.vulnerable_versions,
      parche: a.patched_versions,
      titulo: a.title,
      rutas: [...new Set((a.findings ?? []).flatMap((f) => f.paths ?? []))],
    }));
  return { contadores, criticas };
}

function medir(rutaInforme, hoy) {
  const v = veredicto(rutaInforme);
  if (v.motivo) {
    console.error('::error::la auditoría de dependencias NO PUDO CORRER — las dependencias NO se evaluaron');
    console.error(`  ${v.motivo}`);
    console.error('  Esto NO es un hallazgo de seguridad: es la compuerta diciendo que no midió.');
    return 1;
  }

  const { contadores, criticas } = v;
  console.log(
    `auditoría de producción: critical=${contadores.critical ?? 0} high=${contadores.high ?? 0} ` +
      `moderate=${contadores.moderate ?? 0} low=${contadores.low ?? 0}`,
  );

  // El informe declara N críticas y sólo se pudieron enumerar M<N: no hay forma
  // de saber si las que faltan están exceptuadas. Bloquea.
  if ((contadores.critical ?? 0) > criticas.length) {
    console.error(
      `::error::el informe declara ${contadores.critical} advisories CRITICAL pero sólo se pudieron ` +
        `identificar ${criticas.length}: no se puede decidir sobre las demás`,
    );
    return 1;
  }

  const { vigentes, vencidas } = excepciones(hoy);
  for (const e of vencidas) {
    console.log(`::warning::la excepción ${e.id} venció el ${e.vence} y ya no suprime nada — revisala o renovala`);
  }
  for (const e of vigentes.values()) {
    if (!criticas.some((c) => c.id === e.id)) {
      console.log(`::warning::la excepción ${e.id} ya no corresponde a ningún advisory: sacala de ${ALLOWLIST}`);
    }
  }

  // HIGH avisa y no bloquea: hoy son 39 en este repo, todas transitivas del
  // árbol de build de Docusaurus. Una compuerta roja desde el primer día es una
  // compuerta que alguien apaga.
  if ((contadores.high ?? 0) > 0) {
    console.log(`::warning::la auditoría encontró ${contadores.high} advisories HIGH — revisalas`);
  }

  const bloqueantes = criticas.filter((c) => !vigentes.has(c.id));
  for (const c of criticas.filter((x) => vigentes.has(x.id))) {
    const e = vigentes.get(c.id);
    console.log(`exceptuada hasta ${e.vence}: ${c.id} (${c.paquete}) — ${e.motivo}`);
  }

  if (bloqueantes.length > 0) {
    console.error(`::error::la auditoría encontró ${bloqueantes.length} advisories CRITICAL sin excepción`);
    for (const c of bloqueantes) {
      console.error(`  ${c.id} ${c.paquete} ${c.rango} (parche: ${c.parche}) — ${c.titulo}`);
      for (const ruta of c.rutas) console.error(`    vía ${ruta}`);
    }
    return 1;
  }
  return 0;
}

// ── Auto-test ───────────────────────────────────────────────────────────────
// La casa no le cree a una compuerta que no demostró discriminar. Esto no es
// decoración: el error que este script existe para evitar es justamente que los
// dos desenlaces se lean iguales, así que hay que VER que se leen distinto.
async function autoTest() {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const yo = fileURLToPath(import.meta.url);

  const limpio = {
    advisories: {},
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
  };
  const conCritica = {
    advisories: {
      '1120422': {
        id: 1120422,
        github_advisory_id: 'GHSA-ejemplo-0000-test',
        severity: 'critical',
        module_name: 'paquete-de-prueba',
        title: 'advisory sintético del auto-test',
        vulnerable_versions: '<1.0.0',
        patched_versions: '>=1.0.0',
        findings: [{ version: '0.9.0', paths: ['.>paquete-de-prueba'] }],
      },
    },
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 1 } },
  };
  const excepcion = (vence) => ({
    excepciones: [{ id: 'GHSA-ejemplo-0000-test', paquete: 'paquete-de-prueba', motivo: 'auto-test', vence }],
  });

  const casos = [
    ['registro inalcanzable', { error: { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' } }, null, 1, 'NO PUDO CORRER'],
    ['endpoint que devuelve HTML', { error: { code: 'ERR_PNPM_AUDIT_BAD_RESPONSE', message: 'responded with 405' } }, null, 1, 'NO PUDO CORRER'],
    ['informe sin veredicto', { algo: 'otra cosa' }, null, 1, 'NO PUDO CORRER'],
    ['árbol limpio', limpio, null, 0, null],
    ['CRITICAL sin excepción', conCritica, null, 1, 'sin excepción'],
    ['CRITICAL con excepción vigente', conCritica, excepcion('2999-01-01'), 0, null],
    ['CRITICAL con excepción VENCIDA', conCritica, excepcion('2000-01-01'), 1, 'sin excepción'],
    ['más CRITICAL declaradas que identificables', { advisories: {}, metadata: { vulnerabilities: { critical: 2, high: 0 } } }, null, 1, 'no se puede decidir'],
  ];

  let fallos = 0;
  for (const [nombre, informe, lista, esperado, fragmento] of casos) {
    const dir = mkdtempSync(join(tmpdir(), 'audit-selftest-'));
    try {
      writeFileSync(join(dir, 'audit.json'), JSON.stringify(informe));
      if (lista) writeFileSync(join(dir, ALLOWLIST), JSON.stringify(lista));
      let codigo = 0;
      let salida = '';
      try {
        salida = execFileSync(process.execPath, [yo, 'audit.json'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (err) {
        codigo = err.status ?? 1;
        salida = `${err.stdout ?? ''}${err.stderr ?? ''}`;
      }
      const okCodigo = codigo === esperado;
      const okTexto = !fragmento || salida.includes(fragmento);
      if (okCodigo && okTexto) {
        console.log(`  ok   ${nombre} → exit ${codigo}`);
      } else {
        fallos += 1;
        console.error(`  FALLA ${nombre}: exit ${codigo} (esperado ${esperado})${okTexto ? '' : `, sin «${fragmento}»`}`);
        console.error(salida.split('\n').map((l) => `        ${l}`).join('\n'));
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  // El caso de la ruta que se escapa se prueba acá mismo, sin subproceso.
  try {
    rutaDelRepo('../../etc/passwd');
    fallos += 1;
    console.error('  FALLA ruta fuera del repositorio: no lanzó');
  } catch {
    console.log('  ok   ruta fuera del repositorio → lanza');
  }

  if (fallos > 0) {
    console.error(`::error::el auto-test de la compuerta de dependencias falló en ${fallos} caso(s)`);
    return 1;
  }
  console.log('auto-test: la compuerta discrimina los cuatro desenlaces (no midió / limpio / crítica / exceptuada).');
  return 0;
}

const argumento = process.argv[2] ?? 'audit.json';
const codigo = argumento === '--self-test'
  ? await autoTest()
  : (() => {
      try {
        return medir(argumento, new Date().toISOString().slice(0, 10));
      } catch (err) {
        console.error(`::error::la auditoría de dependencias NO PUDO CORRER — ${err.message}`);
        return 1;
      }
    })();
process.exit(codigo);
