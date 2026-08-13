-- Tech WHT / ITF263 stubs (D-50 Pack T5).

CREATE TABLE IF NOT EXISTS itf263_records (
  technician_id TEXT NOT NULL,
  year_of_assessment INT NOT NULL,
  cleared_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (technician_id, year_of_assessment)
);

CREATE TABLE IF NOT EXISTS withholding_balances (
  technician_id TEXT NOT NULL,
  year_of_assessment INT NOT NULL,
  gross_paid_minor BIGINT NOT NULL DEFAULT 0,
  withheld_minor BIGINT NOT NULL DEFAULT 0,
  has_itf263 BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (technician_id, year_of_assessment)
);
