#!/usr/bin/env python3
"""Private FTPS terminal state; stdout contains only three booleans."""
import json
import pathlib
import re
import sys
import tempfile
from health_adapter import ftp, quote

expected = sys.argv[1]
if not re.fullmatch(r"[A-Za-z0-9._-]+", expected):
    raise SystemExit("Invalid bundle version")
state = {"available": False, "deployed": False, "failed": False}
try:
    with tempfile.TemporaryDirectory(prefix="docs-activation-") as temporary:
        folder = pathlib.Path(temporary)
        # Missing state means no terminal proof yet, never success.
        ftp("cd .deploy\nset cmd:fail-exit no\nget .deployed_version -o " + quote(folder / "deployed") +
            "\nget .failed_version -o " + quote(folder / "failed"))
        def read(name):
            path = folder / name
            return path.read_text().strip() if path.is_file() else ""
        state = {"available": bool(read("deployed")), "deployed": read("deployed") == expected,
                 "failed": read("failed") == expected}
        if state["deployed"]:
            ftp("cd .deploy\nget logs/activate.log -o " + quote(folder / "log"))
            evidence = re.findall(r"docs-health: source=docroot-files url_env_present=(true|false) url_env_matches_file=(true|false) marker_env_present=(true|false) marker_env_matches_file=(true|false)", read("log"))
            if evidence:
                state.update(dict(zip(["urlEnvPresent", "urlEnvMatchesFile", "markerEnvPresent", "markerEnvMatchesFile"],
                                      [item == "true" for item in evidence[-1]])))
                state["adapterObserved"] = True
except (ValueError, OSError):
    pass
print(json.dumps(state))
