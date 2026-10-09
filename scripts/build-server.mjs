import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

export async function serveBuild() {
  const build = fileURLToPath(new URL('../build/', import.meta.url));
  const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp'};
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(build, `.${pathname}`, extname(pathname) ? '' : 'index.html');
      if (!file.startsWith(build.endsWith(sep) ? build : build + sep)) {
        response.writeHead(404).end();
        return;
      }
      const contents = await readFile(file);
      response.writeHead(200, {'Content-Type': mime[extname(file)] ?? 'application/octet-stream'});
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
  return {origin: `http://127.0.0.1:${server.address().port}`, close: async () => {
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    }};
}
