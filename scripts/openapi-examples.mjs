/** Only illustrative values and credential examples embedded in descriptive prose are sanitized. Contract keys, types, requirements,
 * security, operation IDs and paths are never rewritten. */
// Scan a prefix and its suffix separately. Sticky suffix matching advances
// through each character once, without nested alternatives/backtracking.
// A hyphen is part of a word here: demo-sk-value is not a credential example.
const KEY_PREFIX = /(?<![\p{L}\p{N}_-])(ak|sk)-/gu;
const KEY_PART = /[A-Za-z0-9_-]+|\.{3}|…|<[^<>\r\n]+>/y;
const WORD_CHARACTER = /[\p{L}\p{N}_-]/u;
const JWT = /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g;

function credentialEnd(text, start) {
  let end = start;
  KEY_PART.lastIndex = start;
  while (KEY_PART.exec(text)) end = KEY_PART.lastIndex;
  return end;
}

function keyMarker(prefix, suffix) {
  if (prefix === 'sk') return 'USER_API_KEY_EXAMPLE';
  // Integration/service credentials are not application keys, including
  // their documented <prefix><secret> and truncated/masked representations.
  const kind = /^(int|svc)(?:-|\.{3}|…|$)/.exec(suffix)?.[1];
  const markers = {int: 'INTEGRATION_API_KEY_EXAMPLE', svc: 'SERVICE_API_KEY_EXAMPLE'};
  return markers[kind] ?? 'APP_API_KEY_EXAMPLE';
}

function sanitizeKeys(text) {
  const parts = [];
  let copiedTo = 0;
  for (const match of text.matchAll(KEY_PREFIX)) {
    if (match.index < copiedTo) continue;
    const suffixStart = match.index + match[0].length;
    const end = credentialEnd(text, suffixStart);
    if (WORD_CHARACTER.test(String.fromCodePoint(text.codePointAt(end) ?? 0))) continue;
    parts.push(text.slice(copiedTo, match.index), keyMarker(match[1], text.slice(suffixStart, end)));
    copiedTo = end;
  }
  parts.push(text.slice(copiedTo));
  return parts.join('');
}

export function sanitizeOpenApiExamples(spec) {
  let changed = 0;
  const visit = (value, example = false) => {
    if (typeof value === 'string') {
      if (!example) return value;
      const safe = sanitizeKeys(value).replace(JWT, 'JWT_ACCESS_TOKEN_EXAMPLE');
      if (safe !== value) changed++;
      return safe;
    }
    if (Array.isArray(value)) return value.map(child => visit(child, example));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child, example || ['example', 'examples', 'default', 'description'].includes(key))]));
  };
  return {spec: visit(spec), changed};
}
