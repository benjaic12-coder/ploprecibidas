import { hasAdminSession } from './_admin-auth.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const types = new Map([['image/webp','webp'],['image/jpeg','jpg'],['image/png','png']]);

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!await hasAdminSession(request)) return json({ error: 'unauthorized' }, 401);
  const supabaseUrl = Netlify.env.get('SUPABASE_URL');
  const serviceRoleKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'backend_not_configured' }, 503);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) return json({ error: 'product_id_required' }, 400);
  const type = (request.headers.get('content-type') || '').split(';')[0].toLowerCase();
  const extension = types.get(type);
  if (!extension) return json({ error: 'Solo se permiten imágenes JPG, PNG o WebP.' }, 415);
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > 6 * 1024 * 1024) return json({ error: 'La imagen no puede superar 6 MB.' }, 413);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 6 * 1024 * 1024) return json({ error: 'La imagen está vacía o supera 6 MB.' }, 413);
  const stamp = Date.now();
  const objectPath = `${id}/${stamp}.${extension}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${objectPath}`, {
    method: 'POST',
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'content-type': type, 'x-upsert': 'false' },
    body: bytes,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) return json({ error: 'image_upload_failed', detail: payload }, 502);
  return json({ image_url: `${supabaseUrl}/storage/v1/object/public/product-images/${objectPath}` }, 201);
};

export const config = {
  path: '/api/product-image',
  method: ['POST'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 12 },
};
