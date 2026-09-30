FROM rclone/rclone:1.67.0

# Install additional tools
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    bash

# Create directories with proper permissions
RUN mkdir -p /var/log/rclone /tmp/rclone /config/rclone /root/.config/rclone

# Copy setup script
COPY rclone-setup.sh /usr/local/bin/rclone-setup.sh
RUN chmod +x /usr/local/bin/rclone-setup.sh

# Set timezone
ENV TZ=UTC

# Create non-root user for security
RUN adduser -D -s /bin/sh rcloneuser

# Fix permissions for directories that exist
RUN chown -R rcloneuser:rcloneuser /var/log/rclone /tmp/rclone /config/rclone

# Note: /root/.config will be created by the setup script at runtime
# and doesn't need permission changes since the script runs as root initially

# Setup rclone config on container start (runs as root initially, then switches if needed)
ENTRYPOINT ["/usr/local/bin/rclone-setup.sh"]