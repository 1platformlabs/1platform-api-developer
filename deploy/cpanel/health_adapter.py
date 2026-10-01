#!/usr/bin/env python3
"""Install only the QA adapter around the inspected, immutable Core activator."""
import hashlib
import os
import pathlib
import subprocess
import tempfile

ORIGINAL_SHA = "fa5d955390006396e9070a4d653b83f3d9d5bc3536a4111b26d93f1b16524c83"
CORE_NAME = "activate-core." + ORIGINAL_SHA + ".sh"


def normalized_sha(content):
    # Matches the private diagnostic exactly (read_text().strip()), including
    # universal newlines. Backup transfer separately verifies the original bytes.
    text = content.decode().replace("\r\n", "\n").replace("\r", "\n").strip()
    return hashlib.sha256(text.encode()).hexdigest()


def installation_action(current, backup, adapter):
    if backup is not None and normalized_sha(backup) != ORIGINAL_SHA:
        raise ValueError("Unknown backup; preserving remote files")
    if current == adapter:
        if backup is None:
            raise ValueError("Adapter without verified core; preserving remote files")
        return "unchanged"
    if normalized_sha(current) != ORIGINAL_SHA:
        raise ValueError("Unknown remote activator; preserving remote files")
    return "install"


def quote(value):
    return '"' + str(value).replace('\\', '\\\\').replace('"', '\\"') + '"'


def publish_verified(current, backup, adapter, upload, download, rename):
    """Verify staged bytes before the autonomous cron can see a new entry."""
    expected_core = current if backup is None else backup
    if backup is None:
        upload(CORE_NAME + ".part", current)
    upload("activate.sh.part", adapter)
    core_staging = CORE_NAME + ".part" if backup is None else CORE_NAME
    if download(core_staging) != expected_core or download("activate.sh.part") != adapter:
        raise ValueError("Staged transfer truncated or changed; original activator preserved")
    if download("activate.sh") != current:
        raise ValueError("Activator changed during staging; preserving remote entry")
    if backup is None:
        rename(CORE_NAME + ".part", CORE_NAME)
    # Re-verify the immutable core under the exact name the adapter will execute.
    if download(CORE_NAME) != expected_core:
        raise ValueError("Core backup failed readback; original activator preserved")
    rename("activate.sh.part", "activate.sh")
    if download("activate.sh") != adapter:
        raise ValueError("Installed adapter changed after promotion; inspect remote entry")


def ftp(commands):
    credentials = [os.environ.get(name, "") for name in ("CPANEL_FTP_HOST", "CPANEL_FTP_USER", "CPANEL_FTP_PASS")]
    if not all(credentials):
        raise ValueError("Incomplete FTPS configuration")
    host, user, password = credentials
    config = ("set cmd:fail-exit yes\nset xfer:clobber on\nset ftp:ssl-force true\n"
              "set ftp:ssl-protect-data true\nset ssl:verify-certificate yes\n"
              "set net:max-retries 2\nset net:timeout 20\n")
    result = subprocess.run(["lftp", "-u", user + "," + password, host],
                            input=config + commands + "\nbye\n", capture_output=True, text=True)
    if result.returncode:
        raise ValueError("Private FTPS operation failed; remote output withheld")
    return result.stdout


def main():
    adapter = pathlib.Path("deploy/cpanel/activate-docs.sh").read_bytes()
    with tempfile.TemporaryDirectory(prefix="docs-health-") as temporary:
        folder = pathlib.Path(temporary)
        current_path, backup_path = folder / "current", folder / "backup"
        listing = ftp("cd .deploy/bin\ncls -1")
        backup_exists = CORE_NAME in [pathlib.PurePosixPath(line.strip()).name for line in listing.splitlines()]
        commands = "cd .deploy\nget bin/activate.sh -o " + quote(current_path)
        commands += "\nget .health_url -o " + quote(folder / "url")
        commands += "\nget .health_marker -o " + quote(folder / "marker")
        if backup_exists:
            commands += "\nget bin/" + CORE_NAME + " -o " + quote(backup_path)
        ftp(commands)
        url = (folder / "url").read_text().strip()
        marker = (folder / "marker").read_text().strip()
        index = pathlib.Path("cpanel-dist/public/index.html").read_text()
        if url != "https://developer-qa.1platform.pro/index.html" or not marker or marker not in index:
            raise ValueError("QA health configuration not confirmed; adapter unchanged")
        current = current_path.read_bytes()
        backup = backup_path.read_bytes() if backup_exists else None
        action = installation_action(current, backup, adapter)
        if action == "unchanged":
            print("::notice::QA health adapter: already installed; original core verified")
            return
        def upload(name, content):
            path = folder / ("upload-" + name)
            path.write_bytes(content)
            ftp("cd .deploy/bin\nput " + quote(path) + " -o " + quote(name) + "\nchmod 700 " + quote(name))
        def download(name):
            path = folder / ("read-" + name)
            ftp("cd .deploy/bin\nget " + quote(name) + " -o " + quote(path))
            return path.read_bytes()
        def rename(source, destination):
            ftp("cd .deploy/bin\nmv " + quote(source) + " " + quote(destination))
        publish_verified(current, backup, adapter, upload, download, rename)
        print("::notice::QA health adapter installed; original core backup preserved byte-for-byte; cron unchanged")


if __name__ == "__main__":
    try:
        main()
    except ValueError as error:
        raise SystemExit("::error::" + str(error)) from None
