#!/usr/bin/env bash
set -euo pipefail

# Simple Postgres export script
# Requires either PG_CONNECTION_STRING, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE env vars
# Outputs:
#  - backend/backups/budget_app_full_backup.sql
#  - backend/backups/transactions.csv, fortnight_snapshots.csv, debts.csv, budget_profiles.csv, skipped_debt_payments.csv

BAX_SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$(cd "${BAX_SCRIPT_DIR}/.." && pwd)/backups"
mkdir -p "$BACKUP_DIR"

# Determine connection args
if [[ -n "${PG_CONNECTION_STRING:-}" ]]; then
  CONN_STR="${PG_CONNECTION_STRING}"
  PSQL_ARGS=("${CONN_STR}")
else
  : "${PGHOST:?PGHOST is required}" "${PGPORT:?PGPORT is required}" "${PGUSER:?PGUSER is required}" "${PGPASSWORD:?PGPASSWORD is required}" "${PGDATABASE:?PGDATABASE is required}"
  export PGPASSWORD
  PSQL_ARGS=("-h" "$PGHOST" "-p" "$PGPORT" "-U" "$PGUSER" "-d" "$PGDATABASE")
fi

full_dump() {
  echo "Attempting full SQL dump with local pg_dump..."
  if [[ -n "${PG_CONNECTION_STRING:-}" ]]; then
    if pg_dump --dbname="$PG_CONNECTION_STRING" > "$BACKUP_DIR/budget_app_full_backup.sql" 2>"$BACKUP_DIR/pg_dump.err"; then
      echo "Wrote full backup: $BACKUP_DIR/budget_app_full_backup.sql"
      return 0
    fi
  else
    if pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" > "$BACKUP_DIR/budget_app_full_backup.sql" 2>"$BACKUP_DIR/pg_dump.err"; then
      echo "Wrote full backup: $BACKUP_DIR/budget_app_full_backup.sql"
      return 0
    fi
  fi

  echo "Local pg_dump failed. Trying Docker fallback matching server major version..."
  # Detect server version
  local server_version=""
  if [[ -n "${PG_CONNECTION_STRING:-}" ]]; then
    server_version=$(psql "$PG_CONNECTION_STRING" -t -A -c "SHOW server_version" 2>/dev/null || echo "")
  else
    server_version=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -A -c "SHOW server_version" 2>/dev/null || echo "")
  fi
  local major="${server_version%%.*}"
  if [[ -z "$major" ]]; then
    echo "Could not detect server version; skipping full dump. See $BACKUP_DIR/pg_dump.err"
    return 1
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker not available; skipping Docker pg_dump fallback."
    return 1
  fi

  echo "Using Docker image postgres:${major} for pg_dump..."
  if [[ -n "${PG_CONNECTION_STRING:-}" ]]; then
    docker run --rm -e PGPASSWORD="$PGPASSWORD" postgres:"${major}" \
      pg_dump --dbname="$PG_CONNECTION_STRING" > "$BACKUP_DIR/budget_app_full_backup.sql" || {
        echo "Docker pg_dump failed; proceeding with CSV exports only."; return 1; }
  else
    docker run --rm -e PGPASSWORD="$PGPASSWORD" postgres:"${major}" \
      pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" > "$BACKUP_DIR/budget_app_full_backup.sql" || {
        echo "Docker pg_dump failed; proceeding with CSV exports only."; return 1; }
  fi
  echo "Wrote full backup (Docker): $BACKUP_DIR/budget_app_full_backup.sql"
}

# Try full dump, but do not abort if it fails
set +e
full_dump
set -e

# Per-table CSV exports
for table in transactions fortnight_snapshots debts budget_profiles skipped_debt_payments; do
  outfile="$BACKUP_DIR/${table}.csv"
  if [[ -n "${PG_CONNECTION_STRING:-}" ]]; then
    psql "$PG_CONNECTION_STRING" -c "COPY ${table} TO STDOUT WITH (FORMAT CSV, HEADER)" > "$outfile"
  else
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "COPY ${table} TO STDOUT WITH (FORMAT CSV, HEADER)" > "$outfile"
  fi
  echo "Wrote ${outfile}"
done

echo "Backup complete."
