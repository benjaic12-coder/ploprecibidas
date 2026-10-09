import { hasAdminSession } from './_admin-auth.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const categories = new Set(['Combos', 'Marcos', 'Carteles', 'Lonas', 'Props', 'Bandas']);
const fields = 'id,category,name,price,description,badge,image_url,spec,is_active,sort_order,updated_at';
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const validImage = (value) => {
  const image = clean(value, 1500);
  if (/^\/?(catalog-photos|clean-product-assets)\/[\w./-]+\.(webp|png|jpe?g)(\?[^\s]*)?$/i.test(image)) return image;
  try {
    const url = new URL(image);
    return url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
      && url.pathname.startsWith('/storage/v1/object/public/product-images/') ? url.toString() : '';
  } catch { return ''; }
};
const normalize = (body, { partial = false } = {}) => {
  const result = {};
  if (!partial || 'category' in body) {
    result.category = clean(body.category, 30);
    if (!categories.has(result.category)) throw new Error('Elegí una categoría válida.');
  }
  if (!partial || 'name' in body) {
    result.name = clean(body.name, 100);
    if (result.name.length < 2) throw new Error('El nombre debe tener al menos 2 caracteres.');
  }
  if (!partial || 'price' in body) {
    result.price = Number(body.price);
    if (!Number.isSafeInteger(result.price) || result.price < 0 || result.price > 100000000) throw new Error('Ingresá un precio válido en pesos.');
  }
  for (const [source, target, limit] of [['description','description',240], ['badge','badge',50], ['spec','spec',180]]) {
    if (!partial || source in body) result[target] = clean(body[source], limit);
  }
  if (!partial || 'image_url' in body) {
    result.image_url = validImage(body.image_url);
    if (!result.image_url) throw new Error('Elegí una imagen del sitio o cargá una imagen desde tu dispositivo.');
  }
  if (!partial || 'sort_order' in body) result.sort_order = Number.isSafeInteger(Number(body.sort_order)) ? Number(body.sort_order) : 100;
  if (!partial || 'is_active' in body) result.is_active = body.is_active !== false;
  return result;
};

export default async (request) => {
  const supabaseUrl = Netlify.env.get('SUPABASE_URL');
  const serviceRoleKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'backend_not_configured' }, 503);
  const admin = await hasAdminSession(request);
  const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'content-type': 'application/json' };
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const adminView = url.searchParams.get('admin') === '1';
    if (adminView && !admin) return json({ error: 'unauthorized' }, 401);
    const response = await fetch(`${supabaseUrl}/rest/v1/product_catalog?select=${fields}&order=sort_order.asc,name.asc`, { headers });
    const data = await response.json().catch(() => null);
    if (!response.ok) return json({ error: 'products_query_failed', detail: data }, 502);
    return json({ products: (data || []).filter((item) => adminView || item.is_active) });
  }

  if (!admin) return json({ error: 'unauthorized' }, 401);
  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: 'invalid_json' }, 400);
    try {
      const product = normalize(body);
      product.id = clean(body.id, 64).toLowerCase();
      if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(product.id)) return json({ error: 'Usá un identificador simple (letras, números y guiones).'}, 400);
      const response = await fetch(`${supabaseUrl}/rest/v1/product_catalog`, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(product) });
      const data = await response.json().catch(() => null);
      if (!response.ok) return json({ error: response.status === 409 ? 'Ya existe un producto con ese identificador.' : 'products_create_failed', detail: data }, response.status === 409 ? 409 : 502);
      return json({ product: data?.[0] }, 201);
    } catch (error) { return json({ error: error.message || 'invalid_product' }, 400); }
  }

  if (request.method === 'PUT') {
    const id = clean(url.searchParams.get('id'), 64);
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) return json({ error: 'product_id_required' }, 400);
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: 'invalid_json' }, 400);
    try {
      const patch = normalize(body, { partial: true });
      const response = await fetch(`${supabaseUrl}/rest/v1/product_catalog?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(patch) });
      const data = await response.json().catch(() => null);
      if (!response.ok) return json({ error: 'products_update_failed', detail: data }, 502);
      if (!data?.length) return json({ error: 'product_not_found' }, 404);
      return json({ product: data[0] });
    } catch (error) { return json({ error: error.message || 'invalid_product' }, 400); }
  }

  if (request.method === 'DELETE') {
    const id = clean(url.searchParams.get('id'), 64);
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) return json({ error: 'product_id_required' }, 400);
    const response = await fetch(`${supabaseUrl}/rest/v1/product_catalog?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ is_active: false }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) return json({ error: 'products_archive_failed', detail: data }, 502);
    if (!data?.length) return json({ error: 'product_not_found' }, 404);
    return json({ archived: id });
  }
  return json({ error: 'method_not_allowed' }, 405);
};

export const config = {
  path: '/api/products',
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 90 },
};
