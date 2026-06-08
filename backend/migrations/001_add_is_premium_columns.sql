-- Migration 001: adiciona colunas is_premium em user_profiles e sessions
-- Executar no Supabase SQL Editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);
