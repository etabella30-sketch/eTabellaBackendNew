# Local Kafka via Docker

Replaces the manual local Kafka install. Run Kafka with one command instead
of starting Zookeeper + Kafka from the terminal each time.

## Prerequisites

- Docker Desktop running on Windows.
- Backend `.env.development` already has `KAFKA_HOST=localhost:9092` — no change needed.
- **Port 9092 must be free.** If you have another Kafka container already running
  (e.g. from `D:\eTabella final\etabella\docker-compose.yml`), stop it first:
  ```powershell
  cd "D:\eTabella final\etabella"
  docker compose stop kafka zookeeper
  ```

## Usage

All commands are run from this `docker/` folder.

```powershell
# Start Kafka in the background
docker compose up -d

# Stop Kafka (data is preserved in the named volume)
docker compose down

# Tail Kafka logs
docker compose logs -f kafka

# Check status
docker compose ps

# Wipe all data and start fresh (DESTRUCTIVE)
docker compose down -v
```

After `docker compose up -d`, wait ~10–20 seconds for the broker to become
healthy, then start the backend services as usual:

```powershell
node start-app.js app=authapi
node start-app.js app=coreapi
# etc.
```

## What's running

| Service     | Image                          | Host port | Purpose                                |
|-------------|--------------------------------|-----------|----------------------------------------|
| kafka       | `apache/kafka:3.8.1`           | 9092      | Kafka broker (KRaft mode, no Zookeeper) |
| kafka-init  | `apache/kafka:3.8.1`           | —         | One-shot — pre-creates required topics, then exits |
| kafka-ui    | `provectuslabs/kafka-ui:latest`| 8080      | Web UI for browsing topics/messages    |

### Why `kafka-init` exists

A fresh Kafka broker has no topics. When NestJS starts a Kafka microservice
(`app.connectMicroservice(createKafkaOptions(...))`), the consumer immediately
subscribes to the topics declared by `@MessagePattern(...)` decorators. If
those topics don't exist yet on the broker, kafkajs throws
`UNKNOWN_TOPIC_OR_PARTITION` ("This server does not host this topic-partition")
and Node v20 crashes the process on the unhandled rejection.

`kafka-init` runs once after the broker is healthy, creates every known topic
with `--if-not-exists`, then exits. After this, the backend's first start
succeeds cleanly. The init container is **idempotent** — re-runs are no-ops if
topics already exist.

**When to update its topic list**: any time a new `@MessagePattern('...')`
decorator is added to the backend. The list lives inline in `docker-compose.yml`
under the `kafka-init` service.

Open <http://localhost:8080> to inspect topics, consumer groups, and messages.

## How it talks to your backend

- The broker exposes **two listeners**:
  - `EXTERNAL` on `localhost:9092` → used by backend services running on the host.
  - `INTERNAL` on `kafka:29092` → used by other containers (kafka-ui).
- Auto topic creation is enabled (`KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`),
  matching the backend's `allowAutoTopicCreation: true` in
  `libs/global/src/utility/kafka/kafka.config.ts`.
- Default partitions: 3. Replication factor: 1 (single-broker dev cluster).

## Troubleshooting

**`Bind for 0.0.0.0:9092 failed: port is already allocated`**
- Another Kafka is already running. Most likely the existing stack at
  `D:\eTabella final\etabella\`. Stop it with:
  ```powershell
  cd "D:\eTabella final\etabella"
  docker compose stop kafka zookeeper
  ```
  Then come back here and `docker compose up -d`.
- To find what process owns 9092 in PowerShell:
  ```powershell
  Get-NetTCPConnection -LocalPort 9092 | Select-Object OwningProcess,State
  ```

**Backend can't connect / `ECONNREFUSED localhost:9092`**
- Wait 15–20s after `docker compose up -d` — broker needs time to elect controller.
- `docker compose ps` should show `kafka` as `healthy`.
- Check logs: `docker compose logs kafka | tail -50`.

**Want to start from a clean slate**
- `docker compose down -v` — removes the `kafka-data` volume. All topics and
  messages are gone. Useful when the broker gets into a weird state.

**Listener / advertised-listener errors in logs**
- The dual-listener setup (INTERNAL/EXTERNAL) is what makes both host code and
  in-network containers work. Don't change it without understanding why both
  exist.

## Adding more services later (optional)

If you want to also run Redis, Postgres, etc. in Docker, add them as additional
services in this same `docker-compose.yml`. The backend's `.env.development`
points Redis at `localhost:6379` and Postgres at the remote Vultr instance, so
neither requires immediate change.
