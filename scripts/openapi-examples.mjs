/** Only illustrative values and credential examples embedded in descriptive prose are sanitized. Contract keys, types, requirements,
 * security, operation IDs and paths are never rewritten. */
// Integration/service credentials are not application keys. Match those first,
// including the documented <prefix><secret> form and truncated format hints.
// A hyphen is part of a word here: demo-sk-value is not a credential example.
const SPECIAL_KEY = /(?<![\p{L}\p{N}_-])ak-(int|svc)(?:-(?:(?:<[^>\r\n]+>)+|(?:[A-Za-z0-9_-]|\.{3}|…)*))?(?:\.{3}|…)?(?![\p{L}\p{N}_-])/gu;
const KEY = /(?<![\p{L}\p{N}_-])(ak|sk)-(?:(?:<[^>\r\n]+>)+|(?:[A-Za-z0-9_-]|\.{3}|…)*)(?![\p{L}\p{N}_-])/gu;
const JWT = /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g;
export function sanitizeOpenApiExamples(spec) {
  let changed = 0;
  const visit = (value, example = false) => {
    if (typeof value === 'string') {
      if (!example) return value;
      const safe = value
        .replace(SPECIAL_KEY, (_, kind) => kind === 'int' ? 'INTEGRATION_API_KEY_EXAMPLE' : 'SERVICE_API_KEY_EXAMPLE')
        .replace(KEY, (_, prefix) => prefix === 'ak' ? 'APP_API_KEY_EXAMPLE' : 'USER_API_KEY_EXAMPLE')
        .replace(JWT, 'JWT_ACCESS_TOKEN_EXAMPLE');
      if (safe !== value) changed++;
      return safe;
    }
    if (Array.isArray(value)) return value.map(child => visit(child, example));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child, example || ['example', 'examples', 'default', 'description'].includes(key))]));
  };
  return {spec: visit(spec), changed};
}
