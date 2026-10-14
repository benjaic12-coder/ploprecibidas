import {mkdirSync,writeFileSync} from 'node:fs';
import {pageMetadata} from '../lib/page-metadata.ts';
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function routeHtml(html,origin,path){
 const meta=pageMetadata(path);
 let result=html.replace(/<title>.*?<\/title>/,`<title>${escape(meta.title)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(meta.description)}">`).replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escape(meta.title)}">`).replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${escape(meta.description)}">`).replace(/<link rel="canonical"[^>]*>/g,'');
 const extras=meta.private?'<meta name="robots" content="noindex,nofollow">':`<link rel="canonical" href="${origin}${meta.canonical}"><meta property="og:url" content="${origin}${meta.canonical}">`;
 return result.replace('</head>',extras+'</head>');
}
export function writeRoutePages(directory,html,origin){
 writeFileSync(`${directory}/index.html`,routeHtml(html,origin,'/'));
 for(const path of ['/privacy','/privacidad','/admin','/admin/recuperar','/baja']){
  mkdirSync(directory+path,{recursive:true});writeFileSync(`${directory}${path}/index.html`,routeHtml(html,origin,path));
 }
}
