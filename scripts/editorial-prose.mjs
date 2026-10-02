import {load} from 'cheerio';

function withoutInlineCode(source) {
  const prose = [];
  let delimiter;
  let pending = [];
  for (const token of source.match(/`+|[^`]+/g) ?? []) {
    if (token === delimiter) {
      prose.push(' ');
      delimiter = undefined;
      pending = [];
    } else if (delimiter) {
      pending.push(token);
    } else if (token.startsWith('`')) {
      delimiter = token;
      pending.push(token);
    } else {
      prose.push(token);
    }
  }
  // An unclosed delimiter is prose, not a license to hide the rest of a page.
  return prose.join('') + pending.join('');
}

/** Only editorial text: executable examples and technical destinations are not tone. */
export function markdownProse(source) {
  let fence;
  const lines = source.split('\n').map((line) => {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker?.startsWith(fence[0]) && marker.length >= fence.length) fence = undefined;
      return '';
    }
    if (marker) { fence = marker; return ''; }
    if (/^(?:import|export)\s/.test(line.trimStart())) return '';
    return line;
  });
  const markdown = withoutInlineCode(lines.join('\n'))
    .replace(/\]\([^\n)]*\)/g, ']')
    .replace(/\{#[^}]+\}/g, '');
  // Parse markup instead of removing tag-shaped substrings. Script/style text
  // is not editorial, and malformed or nested markup cannot evade a regex.
  const $ = load(markdown, {}, false);
  $('script, style').remove();
  return $.text();
}

// Explicit unambiguous second-person forms. Do not ban third-person verbs
// ("la API registra"), plural nouns ("consultas", "pruebas", "descargas", "recargas", "escapes") or
// infer grammar from word endings. Editorial review remains necessary.
const INFORMAL = new Set(`tú tu tus vos ti te tuyo tuya tuyos tuyas podés tenés querés sos registrás necesitás usás enviás necesitas puedes tienes quieres eres estás debes recibes obtienes verás envías llamas guardas creas llevas anulas emites reintentas incluyes registras despachas asignas avanzas repites defines invitas eliges omites respondes sabes operas actúas pagas llenas adjuntas sigues vuelves reemplazas rediriges encuentras usas vendes lees buscas instalas recuerdas cambias autenticas enteras cobras accedes ejecutas muestras ofreces mandas procesas abres sueles añades decides construyes prefieres canjeas acabas configuras confirmas controlas disparas eliminas encolas investigas mides pegas publicas reutilizas verificas vinculas vas pides pierdes necesitarás podrás podrías recibirás recibirías cobraste configuraste retiraste consumiste superaste definiste creaste enviaste guardaste fijaste pediste perdiste usaste recibiste llegaste nombraste ten haz dale mantén`.split(' '));

export function informalForms(text) {
  // "muestras" is a normal plural noun in telemetry. The exception is limited
  // to noun phrases, never an entire file; both noun and verb are tested.
  const editorial = text.replace(/\b(?:las|sus|estas|esas|de|tomar|toma) muestras\b/giu, 'samples');
  const words = editorial.match(/[\p{L}\p{N}_-]+/gu) ?? [];
  return words.filter((word) => INFORMAL.has(word.toLowerCase()));
}
