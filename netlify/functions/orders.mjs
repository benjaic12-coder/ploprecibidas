import { hasAdminSession } from './_admin-auth.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export default async (request) => {
  if (!['GET','PATCH'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
  if (!await hasAdminSession(request)) return json({ error: 'unauthorized' }, 401);

  const supabaseUrl = Netlify.env.get('SUPABASE_URL');
  const serviceRoleKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'backend_not_configured' }, 503);

  const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'content-type': 'application/json' };
  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const until = url.searchParams.get('until');

  if (request.method === 'GET') {
    const filters = [
      'select=id,order_number,customer_name,customer_whatsapp,delivery_date,total,deposit,balance,status,created_at,updated_at',
      'order=created_at.desc',
      'limit=100',
    ];
    if (since) filters.push(`created_at=gte.${encodeURIComponent(since)}`);
    if (until) filters.push(`created_at=lt.${encodeURIComponent(until)}`);
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?${filters.join('&')}`, { headers });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return json({ error: 'orders_query_failed', detail: payload }, 502);
    return json({ orders: payload || [] });
  }

  const orderId = url.searchParams.get('id');
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: 'order_id_required' }, 400);
  const input = await request.json().catch(() => ({}));
  const reason = String(input.reason || '').trim();
  if (reason.length < 5 || reason.length > 500) return json({ error: 'reason_invalid' }, 400);
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_cancel_order`, {
    method: 'POST', headers,
    body: JSON.stringify({ p_order_id: orderId, p_reason: reason }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) return json({ error: 'order_cancel_failed', detail: payload }, 502);
  return json(payload);
};

export const config = {
  path: '/api/orders',
  method: ['GET','PATCH'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 60 },
};
