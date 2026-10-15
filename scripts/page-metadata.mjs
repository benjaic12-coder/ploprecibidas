import {mkdirSync,writeFileSync} from 'node:fs';
import {pageMetadata} from '../lib/page-metadata.ts';
import {SITE_URL,SOCIAL_IMAGE,catalogStructuredData,serializeStructuredData} from '../lib/seo.ts';
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function routeHtml(html,_origin,path){
 const meta=pageMetadata(path);
 let result=html.replace(/<title>.*?<\/title>/,`<title>${escape(meta.title)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(meta.description)}">`).replace(/<meta (?:property="og:[^"]+"|name="twitter:[^"]+"|name="robots")[^>]*>/g,'').replace(/<link rel="canonical"[^>]*>/g,'').replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,'');
 const canonical=`${SITE_URL}${meta.canonical||'/'}`;
 const extras=[`<meta name="robots" content="${meta.private?'noindex,nofollow':'index,follow'}">`,...(!meta.private?[`<link rel="canonical" href="${canonical}">`]:[]),`<meta property="og:type" content="website"><meta property="og:site_name" content="Plop Recibidas"><meta property="og:locale" content="es_AR"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:image" content="${SOCIAL_IMAGE}"><meta property="og:image:alt" content="Combo personalizado de Plop Recibidas"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(meta.title)}"><meta name="twitter:description" content="${escape(meta.description)}"><meta name="twitter:image" content="${SOCIAL_IMAGE}"><meta name="twitter:image:alt" content="Combo personalizado de Plop Recibidas">`,...(path==='/'?[`<script id="plop-structured-data" type="application/ld+json">${serializeStructuredData(catalogStructuredData())}</script>`]:[])].join('');
 return result.replace('</head>',extras+'</head>');
}
export function writeRoutePages(directory,html){
 writeFileSync(`${directory}/index.html`,routeHtml(html,SITE_URL,'/'));
 for(const path of ['/condiciones','/privacy','/privacidad','/admin','/admin/recuperar','/baja']){
  mkdirSync(directory+path,{recursive:true});writeFileSync(`${directory}${path}/index.html`,routeHtml(html,SITE_URL,path));
 }
}
