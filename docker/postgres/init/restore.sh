#!/bin/bash
set -e

LOG_FILE="/backup/restore.log"
DB_CREATED=0

{
  echo "🕐 [$(date)] Restore script starting..."

  until pg_isready -U "$POSTGRES_USER"; do
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 2
  done

  echo "🔍 Checking if 'etabella' database exists..."
  DB_EXISTS=$(psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='etabella'")
  if [[ "$DB_EXISTS" != "1" ]]; then
    echo "📦 Creating database 'etabella'..."
    createdb -U "$POSTGRES_USER" etabella
    DB_CREATED=1
  else
    echo "✅ Database 'etabella' already exists."
  fi

  echo "🔍 Checking if role 'vultradmin' exists..."
  ROLE_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_roles WHERE rolname='vultradmin'")
  if [[ "$ROLE_EXISTS" != "1" ]]; then
    echo "👤 Creating role 'vultradmin'..."
    psql -U "$POSTGRES_USER" -c "CREATE ROLE vultradmin WITH SUPERUSER LOGIN PASSWORD 'postgres';"
  else
    echo "✅ Role 'vultradmin' already exists."
  fi

  if [[ "$DB_CREATED" == "1" ]]; then
    echo "🔁 Restoring etabella from /backup/etabella.backup..."
    pg_restore -U "$POSTGRES_USER" -d etabella /backup/etabella.backup
    echo "🎉 ✅ Restore completed successfully!"
  else
    echo "🛑 Skipping restore. 'etabella' already existed."
  fi

} >> "$LOG_FILE" 2>&1
