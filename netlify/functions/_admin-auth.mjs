const COOKIE_NAME = 'plop_admin_session';
const SESSION_SECONDS = 12 * 60 * 60;

const base64Url = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const sign = async (value, secret) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
};

const getCookie = (request, name) => {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
};

export const createSessionCookie = async (secret) => {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = String(expiresAt);
  const signature = await sign(payload, secret);
  return `${COOKIE_NAME}=${encodeURIComponent(payload + '.' + signature)}; Max-Age=${SESSION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`;
};

export const clearSessionCookie = () => `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;

export const hasAdminSession = async (request) => {
  const secret = Netlify.env.get('PLOP_ADMIN_TOKEN');
  if (!secret) return false;
  const value = getCookie(request, COOKIE_NAME);
  const [payload, suppliedSignature] = value.split('.');
  if (!payload || !suppliedSignature || Number(payload) <= Math.floor(Date.now() / 1000)) return false;
  const expectedSignature = await sign(payload, secret);
  return suppliedSignature === expectedSignature;
};
