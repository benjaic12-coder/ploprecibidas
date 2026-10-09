import { clearSessionCookie, createSessionCookie, hasAdminSession } from './_admin-auth.mjs';

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});

export default async (request) => {
  const sessionSecret = Netlify.env.get('PLOP_ADMIN_SESSION_SECRET')
    || Netlify.env.get('PLOP_ADMIN_TOKEN')
    || Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Netlify.env.get('SUPABASE_URL');
  const supabaseAnonKey = Netlify.env.get('SUPABASE_ANON_KEY')
    || Netlify.env.get('SUPABASE_PUBLISHABLE_KEY')
    || 'sb_publishable_qfyH7f6Y9LZ01Zxn8YbLVg_VC32myst';
  const adminEmail = 'plopsgo@gmail.com';
  if (!sessionSecret || !supabaseUrl || !supabaseAnonKey) return json({ error: 'backend_not_configured' }, 503);

  if (request.method === 'GET') {
    const authenticated = await hasAdminSession(request);
    return json({ authenticated }, authenticated ? 200 : 401);
  }

  if (request.method === 'DELETE') {
    return json({ authenticated: false }, 200, { 'set-cookie': clearSessionCookie() });
  }

  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (email !== adminEmail || !password || password.length > 256) return json({ error: 'invalid_credentials' }, 401);

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const authData = await authResponse.json().catch(() => null);
  if (!authResponse.ok || authData?.user?.email?.toLowerCase() !== adminEmail) {
    return json({ error: 'invalid_credentials' }, 401);
  }

  return json({ authenticated: true }, 200, { 'set-cookie': await createSessionCookie(sessionSecret) });
};

export const config = {
  path: '/api/admin-session',
  method: ['GET', 'POST', 'DELETE'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 20 },
};
