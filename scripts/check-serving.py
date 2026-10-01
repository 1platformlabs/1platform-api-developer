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
    print("nginx 1.27: 9 exact redirects, query preservation, 4 real routes, 3 negative routes, host isolation and HTML fallback passed")
finally:
    subprocess.run(["docker", "stop", container], check=True, stdout=subprocess.DEVNULL)
