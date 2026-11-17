import socialCover from '../public/social/plop-vista-previa-20261117.jpg';
const SOCIAL_PATH = '/social/plop-vista-previa-20261117.jpg';
const SOCIAL_ALT = 'Plop Recibidas: diseños personalizados para tu recibida. Te recibís. Lo celebrás. Lo hacés con Plop!';
// Edge migration: keep the current Pages release while correcting its public SEO URLs.
export const OLD_ORIGIN = 'https://plop-recibidas.pages.dev';
export const SITE_ORIGIN = 'https://ploprecibidas.com.ar';
const PUBLIC_PATHS = new Set(['/', '/index.html', '/privacy', '/privacy/', '/privacidad', '/privacidad/', '/condiciones', '/condiciones/', '/robots.txt', '/sitemap.xml']);

export function replaceOriginStream(body) {
  let pending = '';
  return body.pipeThrough(new TextDecoderStream()).pipeThrough(new TransformStream({
    transform(chunk, controller) {
      pending += chunk;
      let index;
      while ((index = pending.indexOf(OLD_ORIGIN)) !== -1) {
        controller.enqueue(pending.slice(0, index) + SITE_ORIGIN);
        pending = pending.slice(index + OLD_ORIGIN.length);
      }
      const safeLength = Math.max(0, pending.length - OLD_ORIGIN.length + 1);
      controller.enqueue(pending.slice(0, safeLength));
      pending = pending.slice(safeLength);
    },
    flush(controller) { controller.enqueue(pending); },
  })).pipeThrough(new TextEncoderStream());
}

export async function handleRequest(request, fetchOrigin = fetch) {
  const url = new URL(request.url);
  if (['ploprecibidas.com.ar', 'www.ploprecibidas.com.ar'].includes(url.hostname) && url.pathname === SOCIAL_PATH && ['GET', 'HEAD'].includes(request.method)) {
    return new Response(request.method === 'HEAD' ? null : socialCover, {headers: {'content-type':'image/jpeg','cache-control':'public, max-age=31536000, immutable','x-content-type-options':'nosniff'}});
  }
  if (!['ploprecibidas.com.ar', 'www.ploprecibidas.com.ar'].includes(url.hostname)
      || !['GET', 'HEAD'].includes(request.method) || !PUBLIC_PATHS.has(url.pathname)) {
    return fetchOrigin(request);
  }
  // Revalidate public pages so stale validators cannot return an uncorrected 304.
  const upstreamRequest = new Request(request);
  upstreamRequest.headers.delete('if-none-match');
  upstreamRequest.headers.delete('if-modified-since');
  const response = await fetchOrigin(upstreamRequest);
  const type = response.headers.get('content-type') || '';
  if (response.status !== 200 || !/text\/html|text\/plain|(?:application|text)\/xml|(?:application|text)\/javascript/.test(type)) return response;
  const headers = new Headers(response.headers);
  for (const name of ['content-length', 'content-encoding', 'etag', 'last-modified']) headers.delete(name);
  headers.set('cache-control', 'no-cache');
  headers.set('x-plop-seo-domain', 'ploprecibidas.com.ar');
  const rewritten = new Response(response.body ? replaceOriginStream(response.body) : null, {
    status: response.status, statusText: response.statusText, headers,
  });
  if (!type.includes('text/html')) return rewritten;
  return new HTMLRewriter().on('script[src]', {
    element(element) {
      const src = element.getAttribute('src');
      if (src && /^\/assets\/index-[A-Za-z0-9_-]+\.js$/.test(src)) {
        element.setAttribute('src', src + '?plop-domain=20261101');
      }
    },
  }).on('meta[property="og:image"], meta[name="twitter:image"]', {
    element(element) { element.setAttribute('content', SITE_ORIGIN + SOCIAL_PATH); }
  }).on('meta[property="og:image:alt"], meta[name="twitter:image:alt"]', {
    element(element) { element.setAttribute('content', SOCIAL_ALT); }
  }).on('head', {
    element(element) {
      element.append('<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:secure_url" content="' + SITE_ORIGIN + SOCIAL_PATH + '">', {html:true});
    }
  }).transform(rewritten);
}

export default { fetch(request) { return handleRequest(request); } };

