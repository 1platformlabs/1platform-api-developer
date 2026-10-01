#!/usr/bin/env python3
"""Bounded QA migration: diagnose the root redirect before changing its health URL."""
import pathlib
import re
import sys

QA_ORIGIN = "https://developer-qa.1platform.pro"
GUIDE = "/docs/saas/1platform-api/getting-started"
CANONICAL = 'href="https://developer.1platform.pro' + GUIDE + '"'
ROOT_RULE = 'RewriteRule ^$ ' + GUIDE + ' [R=301,L]'


def plan(health_url, marker, failed_version, log, index_html, server_rules):
    if health_url == QA_ORIGIN + "/index.html":
        return "already_migrated", None
    if health_url not in (QA_ORIGIN, QA_ORIGIN + "/"):
        return "health_url_not_qa_root", None
    if ROOT_RULE not in server_rules:
        return "bundle_root_redirect_not_confirmed", None
    if not re.fullmatch(r"qa-[0-9]+\.[0-9]+", failed_version):
        return "quarantined_version_not_confirmed", None
    start = log.rfind("activating version " + failed_version + " ")
    if start < 0:
        return "activation_not_found", None
    # Include the selected activation's first line, then stop at any later one.
    activation = log[start:]
    next_start = activation.find("activating version ", len("activating version "))
    if next_start >= 0:
        activation = activation[:next_start]
    if "health FAILED (final status 301, marker not matched)" not in activation:
        return "rollback_cause_not_confirmed", None
    if "version " + failed_version + " quarantined in .failed_version" not in activation:
        return "quarantine_not_confirmed", None
    if CANONICAL not in index_html:
        return "build_canonical_not_confirmed", None
    # Preserve a valid existing marker. An obsolete title must be replaced by
    # the exact site's canonical, never a bare 200 or a generic HTML marker.
    new_marker = marker if marker and marker in index_html else CANONICAL
    return "root_301_rollback_confirmed", (QA_ORIGIN + "/index.html", new_marker)


def self_test():
    version = "qa-33.1"
    log = ("activating version " + version + " → release\n"
           "health FAILED (final status 301, marker not matched) — rolling back\n"
           "version " + version + " quarantined in .failed_version\n")
    args = [QA_ORIGIN + "/", "old title", version, log, CANONICAL, ROOT_RULE]
    reason, update = plan(*args)
    assert reason == "root_301_rollback_confirmed" and update == (QA_ORIGIN + "/index.html", CANONICAL)
    preserved = args.copy()
    preserved[1] = CANONICAL
    assert plan(*preserved)[1][1] == CANONICAL
    negatives = [(0, "https://developer.1platform.pro/"), (0, QA_ORIGIN + "/api"),
                 (0, "https://user:password@developer-qa.1platform.pro/"), (0, ""),
                 (2, "untrusted-version"), (3, log.replace("301", "500")),
                 (3, log.replace("quarantined", "kept")), (3, ""),
                 (4, "<html>other site</html>"), (5, "RewriteRule ^$ /other [R=301,L]")]
    for index, value in negatives:
        case = args.copy()
        case[index] = value
        assert plan(*case)[1] is None
    later = args.copy()
    later[3] = "activating version qa-33.1 → release\nactivating version qa-34.1 → release\n" + log.split("\n", 1)[1]
    assert plan(*later)[1] is None
    migrated = args.copy()
    migrated[0] = QA_ORIGIN + "/index.html"
    assert plan(*migrated) == ("already_migrated", None)
    print("health config: 14 positive/negative/idempotency cases passed; no network")


if __name__ == "__main__":
    if sys.argv[1:] == ["--self-test"]:
        self_test()
    else:
        folder, build_index = map(pathlib.Path, sys.argv[1:3])
        def read(name):
            path = folder / name
            return path.read_text(errors="replace").strip() if path.is_file() else ""
        index_html = build_index.read_text()
        server_rules = (build_index.parent / ".htaccess").read_text()
        reason, update = plan(read("health_url"), read("health_marker"), read("failed_version"),
                              read("activate.log"), index_html, server_rules)
        print("QA health diagnostic: " + reason)
        if update:
            (folder / "planned_url").write_text(update[0] + "\n")
            (folder / "planned_marker").write_text(update[1] + "\n")
