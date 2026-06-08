-- Migration 003: torna phone e birth_date nullable em user_profiles
-- O plano especifica ambos como opcionais no cadastro

ALTER TABLE user_profiles
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE user_profiles
  ALTER COLUMN birth_date DROP NOT NULL;
