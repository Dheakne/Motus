const supabase = require('../config/supabase');

exports.getPremiumReport = async ({ from, to }) => {
  const { data: rows, error } = await supabase
    .from('premium_subscriptions')
    .select('user_id, source, plan, status, amount_cents, started_at, canceled_at');

  if (error) throw error;

  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  const inRange = (iso) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= fromTime && t <= toTime;
  };

  const active = rows.filter((r) => r.status === 'active');
  const activeStripe = active.filter((r) => r.source === 'stripe');
  const newInPeriod = rows.filter((r) => inRange(r.started_at));
  const canceledInPeriod = rows.filter((r) => r.status === 'canceled' && inRange(r.canceled_at));

  const mrrCents = activeStripe.reduce(
    (sum, r) => sum + (r.plan === 'annual' ? Math.round((r.amount_cents ?? 0) / 12) : (r.amount_cents ?? 0)),
    0
  );

  const activeAtStart = rows.filter(
    (r) =>
      new Date(r.started_at).getTime() < fromTime &&
      (!r.canceled_at || new Date(r.canceled_at).getTime() >= fromTime)
  ).length;

  return {
    period: { from, to },
    active_premium_users: new Set(active.map((r) => r.user_id)).size,
    active_by_source: {
      stripe: activeStripe.length,
      admin: active.length - activeStripe.length,
    },
    active_by_plan: {
      monthly: activeStripe.filter((r) => r.plan === 'monthly').length,
      annual: activeStripe.filter((r) => r.plan === 'annual').length,
    },
    new_subscriptions: newInPeriod.filter((r) => r.source === 'stripe').length,
    new_admin_grants: newInPeriod.filter((r) => r.source === 'admin').length,
    cancellations: canceledInPeriod.length,
    churn_rate: activeAtStart > 0 ? canceledInPeriod.length / activeAtStart : 0,
    mrr_cents: mrrCents,
  };
};
