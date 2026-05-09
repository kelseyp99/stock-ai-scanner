-- Migration: add universe_ids and weekdays_only to scheduler_settings
-- Run once against your MySQL database.
-- Safe to run multiple times (IF NOT EXISTS guards).

ALTER TABLE scheduler_settings
  ADD COLUMN IF NOT EXISTS universe_ids  TEXT         NULL COMMENT 'JSON list of universe IDs, e.g. ["sp500","nasdaq100"]',
  ADD COLUMN IF NOT EXISTS weekdays_only TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = Mon-Fri only; 0 = every day';
