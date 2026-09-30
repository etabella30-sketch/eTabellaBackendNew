# =============================================================================
# monorepo-base — base image carrying node_modules for all 17 NestJS services.
#
# Built once. Each service image extends this and only copies its own main.js.
# Rebuild this image only when package.json or package-lock.json change
# (i.e. when you add/upgrade an npm dependency).
#
# Build context: backend repo root (has package.json + package-lock.json).
# Image: ~700 MB (one-time, shared across all 17 services).
#
# Why Debian (not Alpine)? Alpine's musl libc trips up native modules like
# sharp + canvas; pre-built binaries usually target glibc.
# =============================================================================

FROM node:20-bullseye-slim

WORKDIR /usr/src/app

# Toolchain + system libs needed by native npm modules:
#   - python3 / make / g++   for node-gyp
#   - canvas:  pkg-config, cairo, pango, jpeg, giflib, librsvg, pixman
#   - sharp:   libvips
#   - bcrypt, mediasoup:    use the toolchain above
# Plus runtime tools the backend shells out to (ghostscript, poppler).
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      tzdata \
      bash \
      curl \
      ca-certificates \
      python3 \
      python3-pip \
      build-essential \
      pkg-config \
      libcairo2-dev \
      libpango1.0-dev \
      libjpeg-dev \
      libgif-dev \
      librsvg2-dev \
      libpixman-1-dev \
      libvips-dev \
      ghostscript \
      poppler-utils \
 && rm -rf /var/lib/apt/lists/*

# Default timezone — services log in this TZ, app honors process.env.TZ.
ENV TZ=Asia/Kolkata

# Install only production deps. Using `npm install` because the current
# package-lock.json is out of sync with package.json (missing some transitive
# entries). This matches the pattern used in the existing
# eTabella final/etabella/micro services/nodemodulesimage/Dockerfile.base.
COPY package.json package-lock.json ./
RUN npm install --omit=dev --loglevel=error --no-audit --no-fund

# Marker — services FROM this image can verify the base they're standing on.
LABEL etabella.role="monorepo-base"
