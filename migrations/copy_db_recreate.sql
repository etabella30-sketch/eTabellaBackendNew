-- Recreate the COPY database etabella.tech.uuid on the DigitalOcean cluster (run against -d defaultdb).
-- WITH (FORCE) closes any client still connected to it. Never run this against etabella.com.uuid.
DROP DATABASE IF EXISTS "etabella.tech.uuid" WITH (FORCE);
CREATE DATABASE "etabella.tech.uuid";
