# ── Build stage: fetch SymmetricDS from local assets ───────────────
FROM eclipse-temurin:17-jre AS builder
ARG SYM_VERSION=3.16.2

# Copy the pre-downloaded ZIP into the build context
WORKDIR /tmp
COPY assets/symmetric-server-${SYM_VERSION}.zip ./

# Unzip and install into /opt
RUN apt-get update -y \
 && apt-get install -y unzip \
 && rm -rf /var/lib/apt/lists/* \
 && unzip symmetric-server-${SYM_VERSION}.zip \
 && mv symmetric-server-${SYM_VERSION} /opt/symmetric-server

# ── Runtime stage: lean image ─────────────────────────────────────
FROM eclipse-temurin:17-jre
LABEL maintainer="you@example.com"

ENV SYM_HOME=/opt/symmetric-server
WORKDIR ${SYM_HOME}

# Copy over the prepared SymmetricDS installation
COPY --from=builder ${SYM_HOME} ${SYM_HOME}
# Add entrypoint script
COPY assets/entrypoint.sh /entrypoint.sh

# Make entrypoint executable and install only uuid-runtime
RUN chmod +x /entrypoint.sh \
 && apt-get update -y \
 && apt-get install -y uuid-runtime \
 && rm -rf /var/lib/apt/lists/*

# Expose the HTTP port
EXPOSE 8080

# Run the entrypoint
ENTRYPOINT ["/entrypoint.sh"]
