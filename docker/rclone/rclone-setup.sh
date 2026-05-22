#!/bin/sh
set -eu

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Setting up rclone configuration..."

# Create config directory
mkdir -p /root/.config/rclone
mkdir -p /config/rclone

# Create rclone configuration
cat > /root/.config/rclone/rclone.conf <<EOF
[digitalocean]
type                  = s3
provider              = DigitalOcean
access_key_id         = ${DO_ACCESS_KEY}
secret_access_key     = ${DO_SECRET_KEY}
region                = ${DO_REGION}
endpoint              = https://${DO_ENDPOINT}
download_url  =  https://${DO_CDN_ENDPOINT}/


[minio]
type                  = s3
provider              = Minio
access_key_id         = ${MINIO_USER}
secret_access_key     = ${MINIO_PASS}
endpoint              = ${MINIO_ENDPOINT:-http://minio:9000}
no_check_certificate  = true
force_path_style      = true
EOF


# Copy to /config for compatibility
cp /root/.config/rclone/rclone.conf /config/rclone/rclone.conf

log "✅ Rclone configuration created successfully"
log "Configuration endpoints:"
log "  - DigitalOcean: https://${DO_ENDPOINT}"
log "  - MinIO: ${MINIO_ENDPOINT:-http://minio:9000}"
log "  - DigitalOcean bucket: ${DO_BUCKET}"

# Quick connection test (non-blocking)
log "Performing quick connection tests..."

# Test DigitalOcean (single attempt, short timeout)
if rclone --timeout 15s lsd digitalocean: > /dev/null 2>&1; then
    log "✅ DigitalOcean connection: OK"
else
    log "⚠️ DigitalOcean connection: Failed (check credentials)"
fi

# Test MinIO (single attempt, short timeout)  
if rclone --timeout 15s lsd minio: > /dev/null 2>&1; then
    log "✅ MinIO connection: OK"
else
    log "⚠️ MinIO connection: Failed (check credentials/MinIO status)"
fi

log "✅ rclone container is ready!"
log "📋 Available commands:"
log "  - List DO buckets: docker exec rclone rclone lsd digitalocean:"
log "  - List MinIO buckets: docker exec rclone rclone lsd minio:"
log "  - Sync example: docker exec rclone rclone sync digitalocean:etabella/doc/case123/ minio:etabella/case123/ --progress"

# Start the main process (tail -f /dev/null)
log "Starting main process - container will stay running..."
exec "$@"