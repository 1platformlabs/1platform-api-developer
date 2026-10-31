#!/usr/bin/env python3
"""Exercise the real, pinned nginx routing config against the production build."""
import http.client
import pathlib
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
GUIDE = "/docs/saas/1platform-api/getting-started"
ALIASES = {
    "/": GUIDE,
    "/docs": GUIDE,
    "/docs/": GUIDE,
    "/docs/quick-start": GUIDE,
    "/docs/quick-start/": GUIDE,
    "/docs/saas/1platform-api/overview": GUIDE,
    "/docs/saas/1platform-api/overview/": GUIDE,
    "/api-docs": "/api-reference/1platform-api",
    "/api-docs/": "/api-reference/1platform-api",
}

if not (ROOT / "build/index.html").is_file():
    raise SystemExit("Run pnpm build before check:serving")
container = subprocess.check_output([
    "docker", "run", "--detach", "--rm", "--read-only",
    "--tmpfs", "/var/cache/nginx", "--tmpfs", "/var/run",
    "--publish", "127.0.0.1::80",
    "--volume", str(ROOT / "build") + ":/usr/share/nginx/html:ro",
    "--volume", str(ROOT / "deploy/docker/nginx.conf") + ":/etc/nginx/conf.d/default.conf:ro",
    "nginx:1.27-alpine",
], text=True).strip()

try:
    subprocess.run(["docker", "exec", container, "nginx", "-t"], check=True)
    binding = subprocess.check_output(["docker", "port", container, "80/tcp"], text=True).strip()
    assert binding.startswith("127.0.0.1:")
    port = int(binding.rsplit(":", 1)[1])

    def request(path, host="developer.1platform.pro"):
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
        try:
            connection.request("GET", path, headers={"Host": host})
            response = connection.getresponse()
            body = response.read()
            return response.status, response.getheader("Location"), body
        finally:
            connection.close()

    def headers(path):
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
        try:
            connection.request("GET", path, headers={"Host": "developer.1platform.pro", "Accept-Encoding": "gzip"})
            response = connection.getresponse()
            response.read()
            return response.status, response.getheader("Content-Type"), response.getheader("Content-Encoding")
        finally:
            connection.close()

    deadline = time.monotonic() + 10
    while True:
        try:
            assert request("/index.html")[0] == 200
            break
        except (OSError, http.client.HTTPException):
            if time.monotonic() >= deadline:
                raise
            time.sleep(0.1)

    for path, destination in ALIASES.items():
        status, location, _ = request(path)
        assert (status, location) == (301, destination), (path, status, location)
    assert request("/api-docs?ref=integration&lang=es")[:2] == (301, "/api-reference/1platform-api?ref=integration&lang=es")
    for path in ["/index.html", GUIDE, "/api-reference/1platform-api", "/openapi/1platform-api.json"]:
        assert request(path)[0] == 200, path
    for path in ["/__ruta-que-no-existe__", "/openapi/", "/img/"]:
        assert request(path)[0] == 404, path
    try:
        request("/index.html", "unrelated.invalid")
        raise AssertionError("Unexpected host received a response instead of nginx 444")
    except http.client.RemoteDisconnected:
        pass
    assert b"url=" + GUIDE.encode() in request("/index.html")[2]

    # Agent docs (épica infraestructura-para-agentes-ia, D-2): the index keeps the
    # `text/plain` the reference uses, the pages are `text/markdown`, all with
    # charset and gzip. The html/css/js/woff2 rows are the CONTROL that
    # `include mime.types` kept the inherited table alive: a bare `types {}`
    # would drop them to `application/octet-stream`.
    assets = sorted((ROOT / "build/assets").rglob("*"))
    css = "/" + next(p for p in assets if p.suffix == ".css").relative_to(ROOT / "build").as_posix()
    js = "/" + next(p for p in assets if p.suffix == ".js").relative_to(ROOT / "build").as_posix()
    md = GUIDE + ".md"
    markdown = "text/markdown; charset=utf-8"
    expected = {
        "/llms.txt": ("text/plain; charset=utf-8", "gzip"),
        "/llms-full.txt": ("text/plain; charset=utf-8", "gzip"),
        md: (markdown, "gzip"),
        GUIDE: ("text/html; charset=utf-8", "gzip"),
        css: ("text/css", "gzip"),
        js: ("application/javascript; charset=utf-8", "gzip"),
        "/fonts/manrope-variable.woff2": ("font/woff2", None),
    }
    for extra, content_type in (("/skills/index.json", "application/json"), ("/skills/1platform-hub/SKILL.md", markdown), ("/prompts/maestro.md", markdown)):
        if (ROOT / "build" / extra.lstrip("/")).is_file():
            expected[extra] = (content_type, "gzip")
    for path, (content_type, encoding) in expected.items():
        status, got_type, got_encoding = headers(path)
        assert status == 200, (path, status)
        assert got_type == content_type, (path, got_type, content_type)
        assert got_encoding == encoding, (path, got_encoding, encoding)
    print(f"nginx 1.27: 9 exact redirects, query preservation, 4 real routes, 3 negative routes, host isolation, HTML fallback and {len(expected)} content types passed")
finally:
    subprocess.run(["docker", "stop", container], check=True, stdout=subprocess.DEVNULL)
