import { clearSessionCookie, createSessionCookie, hasAdminSession } from './_admin-auth.mjs';

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});

export default async (request) => {
  const configuredToken = Netlify.env.get('PLOP_ADMIN_TOKEN');
  if (!configuredToken) return json({ error: 'backend_not_configured' }, 503);

  if (request.method === 'GET') {
    return json({ authenticated: await hasAdminSession(request) }, await hasAdminSession(request) ? 200 : 401);
  }

  if (request.method === 'DELETE') {
    return json({ authenticated: false }, 200, { 'set-cookie': clearSessionCookie() });
  }

  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const body = await request.json().catch(() => ({}));
  if (!body.token || body.token !== configuredToken) return json({ error: 'unauthorized' }, 401);

  return json({ authenticated: true }, 200, { 'set-cookie': await createSessionCookie(configuredToken) });
};

export const config = {
  path: '/api/admin-session',
  method: ['GET', 'POST', 'DELETE'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 20 },
};
