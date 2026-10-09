const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const auth = (request) => {
  const expected = Netlify.env.get('PLOP_ADMIN_TOKEN');
  const supplied = request.headers.get('x-admin-token');
  return Boolean(expected && supplied && supplied === expected);
};

export default async (request) => {
  try {
    if (!['GET','DELETE'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
    if (!auth(request)) return json({ error: 'unauthorized' }, 401);

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
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: { ...headers, Prefer: 'return=representation' },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return json({ error: 'order_delete_failed', detail: payload }, 502);
    if (!Array.isArray(payload) || payload.length === 0) return json({ error: 'order_not_found' }, 404);
    return json({ deleted: payload[0].id, order_number: payload[0].order_number });
  }
};

export const config = {
  path: '/api/orders',
  method: ['GET','DELETE'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 60 },
};
