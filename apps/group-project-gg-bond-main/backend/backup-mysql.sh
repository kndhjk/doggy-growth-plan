#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=/home/destiny/backups/ggbond-mysql
DB_NAME=ggbond
DB_USER=root
DB_PASS=ggbond_mysql_2026
STAMP=$(date +%F-%H%M%S)
OUT="$BACKUP_DIR/${DB_NAME}-$STAMP.sql.gz"
LATEST="$BACKUP_DIR/${DB_NAME}-latest.sql.gz"

mkdir -p "$BACKUP_DIR"

mysqldump -u"$DB_USER" -p"$DB_PASS" --single-transaction --routines --triggers "$DB_NAME" | gzip -9 > "$OUT"
ln -sfn "$OUT" "$LATEST"

# Keep last 14 backups only
ls -1t "$BACKUP_DIR"/${DB_NAME}-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f

echo "backup ok: $OUT"
