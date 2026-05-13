#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=/home/destiny/backups/ggbond-mysql
DB_NAME=ggbond
DB_USER=root
DB_PASS=ggbond_mysql_2026
INPUT=${1:-$BACKUP_DIR/ggbond-latest.sql.gz}

if [ ! -f "$INPUT" ]; then
  echo "backup file not found: $INPUT" >&2
  exit 1
fi

TMP_SQL=$(mktemp /tmp/ggbond-restore-XXXXXX.sql)
cleanup() {
  rm -f "$TMP_SQL"
}
trap cleanup EXIT

if [[ "$INPUT" == *.gz ]]; then
  gzip -dc "$INPUT" > "$TMP_SQL"
else
  cp "$INPUT" "$TMP_SQL"
fi

mysql -u"$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$TMP_SQL"

echo "restore ok: $INPUT -> $DB_NAME"
