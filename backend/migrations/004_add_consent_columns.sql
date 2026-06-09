-- Migration 004: adiciona colunas de consentimento (LGPD) em user_profiles
-- Necessária para o cadastro (authService.register grava esses campos)
-- Executar no Supabase SQL Editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS consent_terms boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_health_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consented_at timestamptz;
