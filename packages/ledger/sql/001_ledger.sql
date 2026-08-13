-- Ledger SoR tables (Pack T5) — stub migration; runtime remains in-memory until Supabase Phase 0.
-- Money = amount_minor bigint + currency. AI never inserts payable rows.

CREATE TABLE IF NOT EXISTS ledger_journals (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL REFERENCES ledger_journals(id),
  account TEXT NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  memo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_idem_uq
  ON ledger_entries (idempotency_key);

CREATE TABLE IF NOT EXISTS money_outbox (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
