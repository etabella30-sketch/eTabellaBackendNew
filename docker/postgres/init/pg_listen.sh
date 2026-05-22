#!/bin/bash
set -e

echo "📌 Starting PostgreSQL config tuning..."

CONF_FILE="$PGDATA/postgresql.conf"

if [ ! -f "$CONF_FILE" ]; then
  echo "❌ postgresql.conf not found at $CONF_FILE"
  exit 1
fi

# Function to update or append config values
update_config() {
  local key="$1"
  local value="$2"
  if grep -qE "^[#]*\s*${key}" "$CONF_FILE"; then
    sed -i "s|^[#]*\s*${key}.*|${key} = ${value}|" "$CONF_FILE"
    echo "✔ Updated ${key} = ${value}"
  else
    echo "${key} = ${value}" >> "$CONF_FILE"
    echo "➕ Added ${key} = ${value}"
  fi
}

# Apply settings
update_config "listen_addresses" "'*'"
update_config "shared_buffers" "2GB"
update_config "work_mem" "64MB"
update_config "max_parallel_workers" "4"
update_config "max_parallel_workers_per_gather" "2"
update_config "effective_cache_size" "8GB"
update_config "maintenance_work_mem" "256MB"
update_config "random_page_cost" "1.1"

echo "✅ PostgreSQL config patched successfully!"
