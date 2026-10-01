type Environment = Record<string, string | undefined>;
type ApiId = '1platform-api' | 'atlas-api';

function configuredUrl(value: string, name: string, originOnly: boolean): string {
  const invalid = () => new Error(`${name} requires an absolute HTTPS URL (HTTP only on loopback), without credentials, query or fragment${originOnly ? ', and without a path' : ''}`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalid();
  }
  const loopback = url.hostname === 'localhost' || url.hostname.endsWith('.localhost')
    || /^127(?:\.\d{1,3}){3}$/.test(url.hostname) || url.hostname === '[::1]';
  if (value !== value.trim() || url.username || url.password || url.search || url.hash
    || (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))
    || (originOnly && url.pathname !== '/')) throw invalid();
  return originOnly ? url.origin : url.href;
}

/** Scalar runtime overrides only: the published OpenAPI files remain unchanged. */
export function scalarEnvironment(api: ApiId, env: Environment) {
  const proxy = env.SCALAR_PROXY_URL;
  const serverKey = api === '1platform-api' ? 'ONEP_API_SERVER_URL' : 'ATLAS_API_SERVER_URL';
  const server = env[serverKey];
  return {
    // Empty explicitly selects direct requests; missing preserves public behavior.
    proxyUrl: proxy === undefined ? 'https://proxy.scalar.com' : proxy === '' ? '' : configuredUrl(proxy, 'SCALAR_PROXY_URL', false),
    ...(server === undefined ? {} : {servers: [{url: configuredUrl(server, serverKey, true), description: 'Entorno configurado'}]}),
  };
}
