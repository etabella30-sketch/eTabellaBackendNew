# =============================================================================
# service.Dockerfile — generic per-service runner. ONE file for all 17 services.
#
# How it's used (from docker-compose.yml):
#   build:
#     context: ..               # backend root, so we can FROM monorepo-base
#     dockerfile: docker/microservices/service.Dockerfile
#     args:
#       APP_NAME: authapi
#
# This builds a self-contained image carrying:
#   - node_modules (from monorepo-base)
#   - the service's bundled main.js (from docker/microservices/apps/<APP_NAME>/main.js)
#   - .env (from docker/microservices/.env)
#
# Image is small per-service because everything heavy is in the base layer.
# =============================================================================

FROM monorepo-base:latest

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

WORKDIR /usr/src/app

# The bundled webpack output for this service.
COPY docker/microservices/apps/${APP_NAME}/main.js ./main.js

# Shared env file. main.ts uses `dotenv.config({ path: ".env.${NODE_ENV}" })`,
# so with NODE_ENV=docker (set below) the file must be named .env.docker.
COPY docker/microservices/.env ./.env.docker

# Many services log to stdout via console.log/console.error — keep both unbuffered.
ENV NODE_OPTIONS=--unhandled-rejections=warn
ENV NODE_ENV=docker

CMD ["node", "/usr/src/app/main.js"]
