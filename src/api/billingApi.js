import { api } from './api';
import { getAuthToken } from './authApi';

export async function getPremiumStatus() {
  return api.get('/api/premium/status', await getAuthToken());
}

export async function createCheckout(plan, returnUrl) {
  return api.post('/api/billing/checkout', { plan, return_url: returnUrl }, await getAuthToken());
}

export async function cancelSubscription() {
  return api.post('/api/billing/cancel', {}, await getAuthToken());
}

export async function resumeSubscription() {
  return api.post('/api/billing/resume', {}, await getAuthToken());
}
