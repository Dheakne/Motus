const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json();
  if (!res.ok) throw { status: res.status, ...json };
  return json.data;
}

export const api = {
  post: (path, body, token) => request('POST', path, body, token),
  patch: (path, body, token) => request('PATCH', path, body, token),
  get: (path, token) => request('GET', path, null, token),
};
