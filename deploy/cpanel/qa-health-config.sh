#!/usr/bin/env bash
# Read only this FTP account's deployment state; emit no remote file contents.
# Migrate its health URL only after the root-301 rollback is proven.
set -euo pipefail
umask 077
PRIVATE="$(mktemp -d)"
trap 'rm -rf "$PRIVATE"' EXIT

if ! lftp -u "$CPANEL_FTP_USER","$CPANEL_FTP_PASS" "$CPANEL_FTP_HOST" >"$PRIVATE/ftp.log" 2>&1 <<FTPEOF
set cmd:fail-exit yes
set xfer:clobber on
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate yes
set net:max-retries 2
set net:timeout 20
cd .deploy
get .health_url -o $PRIVATE/health_url
get .health_marker -o $PRIVATE/health_marker
get .failed_version -o $PRIVATE/failed_version
get logs/activate.log -o $PRIVATE/activate.log
bye
FTPEOF
then
  echo '::notice::QA health diagnostic: state unavailable; existing health configuration preserved'
  exit 0
fi

# No redirect following: a 301 is the exact health failure being diagnosed.
curl -sS --max-time 20 -D "$PRIVATE/root.headers" -o /dev/null \
  -w '%{http_code}' https://developer-qa.1platform.pro/ > "$PRIVATE/root.status" 2>/dev/null || true
python3 deploy/cpanel/health_config.py "$PRIVATE" cpanel-dist/public/index.html
if [[ ! -f "$PRIVATE/planned_url" ]]; then exit 0; fi

# The already-confirmed migration remains within this chrooted developer QA
# account. Do not upload the private diagnostics as artifacts or change cron.
if ! lftp -u "$CPANEL_FTP_USER","$CPANEL_FTP_PASS" "$CPANEL_FTP_HOST" >"$PRIVATE/update.log" 2>&1 <<FTPEOF
set cmd:fail-exit yes
set xfer:clobber on
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate yes
set net:max-retries 2
set net:timeout 20
cd .deploy
put $PRIVATE/planned_marker -o .health_marker.part
put $PRIVATE/planned_url -o .health_url.part
mv .health_marker.part .health_marker
mv .health_url.part .health_url
bye
FTPEOF
then
  echo '::error::QA health migration failed; remote diagnostics remain private'
  exit 1
fi
echo 'QA health migration: /index.html + site-specific marker; 200 and marker checks retained'
