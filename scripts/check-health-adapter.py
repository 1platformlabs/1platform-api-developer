#!/usr/bin/env python3
import importlib.util
import os
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("health_adapter", ROOT / "deploy/cpanel/health_adapter.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
core = (ROOT / "deploy/cpanel/activate.sh").read_bytes()
adapter = (ROOT / "deploy/cpanel/activate-docs.sh").read_bytes()
assert module.normalized_sha(core) == module.ORIGINAL_SHA
assert module.installation_action(core, None, adapter) == "install"
assert module.installation_action(core, core, adapter) == "install"
assert module.installation_action(adapter, core, adapter) == "unchanged"
for current, backup in [(b"foreign edit", None), (core, b"foreign backup"), (adapter, None)]:
    try:
        module.installation_action(current, backup, adapter)
        raise AssertionError("Unknown remote state must be rejected")
    except ValueError:
        pass

# A transport can report upload success while storing truncated bytes. Neither
# the core nor the entry may be promoted until both .part files read back intact.
for truncated in [module.CORE_NAME + ".part", "activate.sh.part", None]:
    remote = {"activate.sh": core}
    promotions = []
    def upload(name, data):
        remote[name] = data[:-10] if name == truncated else data
    def rename(source, destination):
        promotions.append(destination)
        remote[destination] = remote.pop(source)
    if truncated:
        try:
            module.publish_verified(core, None, adapter, upload, remote.__getitem__, rename)
            raise AssertionError("Truncated transfer must not promote anything")
        except ValueError:
            pass
        assert remote["activate.sh"] == core and promotions == []
    else:
        module.publish_verified(core, None, adapter, upload, remote.__getitem__, rename)
        assert remote["activate.sh"] == adapter and remote[module.CORE_NAME] == core
        assert promotions == [module.CORE_NAME, "activate.sh"]

with tempfile.TemporaryDirectory(prefix="docs-adapter-test-") as temporary:
    folder = pathlib.Path(temporary)
    (folder / "bin").mkdir()
    entry = folder / "bin/activate.sh"
    entry.write_bytes(adapter)
    (folder / "bin" / module.CORE_NAME).write_text('''#!/usr/bin/env bash
set -euo pipefail
[[ "$CPANEL_HEALTH_URL" == 'https://developer-qa.1platform.pro/index.html' ]]
[[ "$CPANEL_HEALTH_MARKER" == 'fixture-canonical' ]]
printf 'executed' > "$CPANEL_DEPLOY_ROOT/executed"
exit "${TEST_CORE_EXIT:-0}"
''')
    (folder / ".health_url").write_text("https://developer-qa.1platform.pro/index.html\n")
    (folder / ".health_marker").write_text("fixture-canonical\n")
    environment = {**os.environ, "CPANEL_DEPLOY_ROOT": str(folder),
                   "CPANEL_HEALTH_URL": "do-not-print-old-url", "CPANEL_HEALTH_MARKER": "do-not-print-old-marker"}
    def run(extra=None):
        return subprocess.run(["bash", str(entry)], env={**environment, **(extra or {})}, capture_output=True, text=True)
    for _ in range(2):
        result = run()
        assert result.returncode == 0 and (folder / "executed").read_text() == "executed"
        assert "url_env_matches_file=false" in result.stdout
        assert "do-not-print" not in result.stdout + result.stderr
        assert entry.read_bytes() == adapter
    assert run({"TEST_CORE_EXIT": "7"}).returncode == 7
    assert run({"CPANEL_DEPLOY_ROOT": str(folder.parent)}).returncode != 0
    (folder / ".health_url").write_text("https://other.invalid/index.html\n")
    assert run().returncode != 0
    (folder / ".health_url").write_text("https://developer-qa.1platform.pro/index.html\n")
    (folder / ".health_marker").write_text("\n")
    assert run().returncode != 0
print("health adapter: 15 install/staged-truncation/idempotency/foreign-state/config/exit-status checks passed; no network")
