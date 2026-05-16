-- Re-flagged opportunities tables.
-- Run once against the stock-ai-scanner MySQL database.

CREATE TABLE IF NOT EXISTS scanner_candidate_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL,
  date_flagged DATETIME DEFAULT CURRENT_TIMESTAMP,
  price_when_flagged DOUBLE NULL,
  rsi DOUBLE NULL,
  volume_ratio DOUBLE NULL,
  atr DOUBLE NULL,
  trend_score DOUBLE NULL,
  scanner_category VARCHAR(256) NULL,
  sector VARCHAR(128) NULL,
  asset_type VARCHAR(32) NULL,
  source VARCHAR(64) NULL,
  INDEX ix_candidate_history_ticker (ticker),
  INDEX ix_candidate_history_date_flagged (date_flagged)
);

CREATE TABLE IF NOT EXISTS fib_retracement_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  swing_low DOUBLE NULL,
  swing_high DOUBLE NULL,
  fib_382 DOUBLE NULL,
  fib_500 DOUBLE NULL,
  fib_618 DOUBLE NULL,
  hit_level VARCHAR(16) NULL,
  asset_type VARCHAR(32) NULL,
  INDEX ix_fib_levels_ticker (ticker),
  INDEX ix_fib_levels_calculated_at (calculated_at)
);

CREATE TABLE IF NOT EXISTS technical_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL,
  alert_type VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NULL,
  message TEXT NULL,
  payload TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_technical_alerts_ticker (ticker),
  INDEX ix_technical_alerts_alert_type (alert_type),
  INDEX ix_technical_alerts_created_at (created_at)
);
