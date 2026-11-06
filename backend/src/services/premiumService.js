const supabase = require('../config/supabase');

exports.syncUserPremium = async (userId) => {
  const { count, error } = await supabase
    .from('premium_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw error;

  const isPremium = (count ?? 0) > 0;

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  return isPremium;
};

exports.getPremiumStatus = async (userId) => {
  const [profileResult, subscriptionResult] = await Promise.all([
    supabase.from('user_profiles').select('is_premium').eq('user_id', userId).maybeSingle(),
    supabase
      .from('premium_subscriptions')
      .select('source, plan, status, amount_cents, currency, cancel_at_period_end, current_period_end, started_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (subscriptionResult.error) throw subscriptionResult.error;

  return {
    is_premium: !!profileResult.data?.is_premium,
    subscription: subscriptionResult.data?.[0] ?? null,
  };
};

exports.grantAdminPremium = async (userId, adminId) => {
  const { data: existing, error: fetchError } = await supabase
    .from('premium_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'admin')
    .eq('status', 'active')
    .limit(1);

  if (fetchError) throw fetchError;

  if (!existing?.length) {
    const { error: insertError } = await supabase
      .from('premium_subscriptions')
      .insert([{ user_id: userId, source: 'admin', status: 'active', granted_by: adminId }]);
    if (insertError) throw insertError;
  }

  return exports.syncUserPremium(userId);
};

exports.revokeAdminPremium = async (userId) => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('premium_subscriptions')
    .update({ status: 'canceled', canceled_at: now, updated_at: now })
    .eq('user_id', userId)
    .eq('source', 'admin')
    .eq('status', 'active');

  if (error) throw error;

  return exports.syncUserPremium(userId);
};
