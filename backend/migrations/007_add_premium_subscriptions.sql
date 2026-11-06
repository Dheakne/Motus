-- Migration 007: histórico de assinaturas premium + proteção do is_premium
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('stripe', 'admin')),
  plan text CHECK (plan IN ('monthly', 'annual')),
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'incomplete', 'canceled')),
  amount_cents integer,
  currency text NOT NULL DEFAULT 'brl',
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  current_period_end timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user ON premium_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_started_at ON premium_subscriptions (started_at DESC);

ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assinatura: ler a propria" ON premium_subscriptions;
CREATE POLICY "assinatura: ler a propria" ON premium_subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION protect_is_premium() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_premium := false;
    ELSIF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'is_premium só pode ser alterado pelo backend'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_is_premium ON user_profiles;
CREATE TRIGGER trg_protect_is_premium
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION protect_is_premium();

CREATE OR REPLACE FUNCTION enforce_premium_challenge() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.challenge_id IS NOT DISTINCT FROM OLD.challenge_id THEN
    RETURN NEW;
  END IF;

  IF current_user IN ('anon', 'authenticated')
     AND EXISTS (SELECT 1 FROM weekly_challenges WHERE id = NEW.challenge_id AND is_free = false)
     AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = NEW.user_id AND is_premium = true)
  THEN
    RAISE EXCEPTION 'Este exercício requer uma assinatura premium'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_premium_challenge ON user_challenge_progress;
CREATE TRIGGER trg_enforce_premium_challenge
  BEFORE INSERT OR UPDATE OF challenge_id ON user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION enforce_premium_challenge();
