const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export default async (request) => {
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const adminToken = Netlify.env.get('PLOP_ADMIN_TOKEN');
  const suppliedToken = request.headers.get('x-admin-token');
  if (!adminToken || !suppliedToken || suppliedToken !== adminToken) return json({ error: 'unauthorized' }, 401);

  const supabaseUrl = Netlify.env.get('SUPABASE_URL');
  const serviceRoleKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'backend_not_configured' }, 503);

  const url = new URL(request.url);
  const since = url.searchParams.get('since') || new Date(Date.now() - 30 * 86400000).toISOString();
  const until = url.searchParams.get('until') || new Date().toISOString();
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_kpis`, {
    method: 'POST',
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_since: since, p_until: until }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) return json({ error: 'kpi_query_failed', detail: payload }, 502);
  return json(payload);
};

export const config = {
  path: '/api/kpis',
  method: ['GET'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 60 },
};

