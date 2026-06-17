-- ─────────────────────────────────────────────────────────────────────────────
-- AutoLend — Neon.tech Database Setup
-- Run this in the Neon SQL Editor (console.neon.tech → SQL Editor)
-- You need to create BOTH databases in your Neon project first:
--   console.neon.tech → Your Project → Databases → + Create Database
--   Create: "arthacore_bank" and "arthacore_risk"
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Run this in the "arthacore_bank" database ─────────────────────────────────
-- (select arthacore_bank from the database dropdown in Neon SQL Editor)

-- Grant all privileges to neondb_owner (already the owner, but just in case)
GRANT ALL PRIVILEGES ON DATABASE arthacore_bank TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO neondb_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO neondb_owner;

-- ── Run this in the "arthacore_risk" database ─────────────────────────────────
-- (switch to arthacore_risk from the dropdown)

-- GRANT ALL PRIVILEGES ON DATABASE arthacore_risk TO neondb_owner;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO neondb_owner;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO neondb_owner;

-- NOTE: Spring Boot with ddl-auto=update will auto-create all tables on first start.
-- No need to manually create tables.
