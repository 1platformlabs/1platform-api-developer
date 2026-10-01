/** Only illustrative values and credential examples embedded in descriptive prose are sanitized. Contract keys, types, requirements,
 * security, operation IDs and paths are never rewritten. */
const KEY = /\b(ak|sk)-[A-Za-z0-9_-]{16,}\b/g;
const JWT = /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g;
export function sanitizeOpenApiExamples(spec) {
  let changed = 0;
  const visit = (value, example = false) => {
    if (typeof value === 'string') {
      if (!example) return value;
      const safe = value.replace(KEY, (_, prefix) => prefix === 'ak' ? 'APP_API_KEY_EXAMPLE' : 'USER_API_KEY_EXAMPLE').replace(JWT, 'JWT_ACCESS_TOKEN_EXAMPLE');
      if (safe !== value) changed++;
      return safe;
    }
    if (Array.isArray(value)) return value.map(child => visit(child, example));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child, example || ['example', 'examples', 'default', 'description'].includes(key))]));
  };
  return {spec: visit(spec), changed};
}
