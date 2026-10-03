/** Publication-only correction for two upstream descriptions. The API decodes
 * JWTs in both headers; ak-/sk- keys are exchanged for those JWTs. OpenAPI's
 * userToken apiKey type describes a custom header, not the value's token format.
 * Never rewrite type, scheme, bearerFormat, in, name, security or operations. */
const descriptions = {
  bearerAuth: 'JWT de aplicación obtenido al canjear su clave API en POST /api/v1/auth/token. Envíelo como Authorization: Bearer <APP_TOKEN>. La clave API de aplicación (APP_API_KEY_EXAMPLE) no se envía en este header.',
  userToken: 'JWT de usuario obtenido al canjear su clave API en POST /api/v1/users/token, con el JWT de aplicación. Envíelo en x-user-token. La clave API de usuario (USER_API_KEY_EXAMPLE) no se envía en este header.',
};

export function correctAuthDescriptions(source, apiId) {
  if (apiId !== '1platform-api') return {spec: source, changed: 0};
  const schemes = source.components?.securitySchemes;
  if (schemes?.bearerAuth?.type !== 'http' || schemes.bearerAuth.scheme !== 'bearer' || schemes.bearerAuth.bearerFormat !== 'JWT' || schemes?.userToken?.type !== 'apiKey' || schemes.userToken.in !== 'header' || schemes.userToken.name !== 'x-user-token') {
    throw new Error('Core authentication metadata changed; review its upstream contract before publishing');
  }
  const spec = structuredClone(source);
  let changed = 0;
  for (const [name, description] of Object.entries(descriptions)) {
    if (spec.components.securitySchemes[name].description !== description) changed++;
    spec.components.securitySchemes[name].description = description;
  }
  return {spec, changed};
}
