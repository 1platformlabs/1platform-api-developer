/** Only editorial text: executable examples and technical destinations are not tone. */
export function markdownProse(source) {
  let fence;
  const lines = source.split('\n').map((line) => {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker?.[0] === fence[0] && marker.length >= fence.length) fence = undefined;
      return '';
    }
    if (marker) { fence = marker; return ''; }
    if (/^\s*(?:import|export)\s/.test(line)) return '';
    return line;
  });
  return lines.join('\n')
    .replace(/(`+)([^`]|(?!\1)`)*?\1/g, '')
    .replace(/\]\([^\n)]*\)/g, ']')
    .replace(/\{#[^}]+\}/g, '')
    .replace(/<[^>]+>/g, '');
}

// Explicit unambiguous second-person forms. Do not ban third-person verbs
// ("la API registra"), plural nouns ("consultas", "pruebas", "descargas", "recargas", "escapes") or
// infer grammar from word endings. Editorial review remains necessary.
const INFORMAL = /(?<![\p{L}\p{N}_-])(?:tú|tu|tus|vos|ti|te|tuyo|tuya|tuyos|tuyas|podés|tenés|querés|sos|registrás|necesitás|usás|enviás|necesitas|puedes|tienes|quieres|eres|estás|debes|recibes|obtienes|verás|envías|llamas|guardas|creas|llevas|anulas|emites|reintentas|incluyes|registras|despachas|asignas|avanzas|repites|defines|invitas|eliges|omites|respondes|sabes|operas|actúas|pagas|llenas|adjuntas|sigues|vuelves|reemplazas|rediriges|encuentras|usas|vendes|lees|buscas|instalas|recuerdas|cambias|autenticas|enteras|cobras|accedes|ejecutas|muestras|ofreces|mandas|procesas|abres|sueles|añades|decides|construyes|prefieres|canjeas|acabas|configuras|confirmas|controlas|disparas|eliminas|encolas|investigas|mides|pegas|publicas|reutilizas|verificas|vinculas|vas|pides|pierdes|necesitarás|podrás|podrías|recibirás|recibirías|cobraste|configuraste|retiraste|consumiste|superaste|definiste|creaste|enviaste|guardaste|fijaste|pediste|perdiste|usaste|recibiste|llegaste|nombraste|ten|haz|dale|mantén)(?![\p{L}\p{N}_-])/giu;

export function informalForms(text) {
  // "muestras" is a normal plural noun in telemetry. A second-person verb
  // without an explicit subject is covered by review, not a broad exception
  // for its file. Both contexts stay tested below.
  const editorial = text.replace(/\b(?:las|sus|estas|esas|de|tomar|toma) muestras\b/giu, 'samples');
  return [...editorial.matchAll(INFORMAL)].map((match) => match[0]);
}
