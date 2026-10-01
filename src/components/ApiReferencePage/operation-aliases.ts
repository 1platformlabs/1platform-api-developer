interface Operation {operationId?: string; tags?: string[]}
export interface OpenApi {paths?: Record<string, Record<string, Operation>>}

/** Translate prototype operation links to Scalar's existing native hashes.
 * Existing tag/method/path hashes are left unchanged. No contract projection. */
export function operationAliases(spec: OpenApi): Map<string, string> {
  const aliases = new Map<string, string>();
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(method) || !operation.operationId) continue;
      const tag = (operation.tags?.[0] ?? '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      aliases.set(`#operation/${operation.operationId}`, `#${tag ? `tag/${tag}/` : ''}${method.toUpperCase()}${path}`);
    }
  }
  return aliases;
}
