import {CONDITIONS,SELLER} from '../lib/conditions.ts';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pageMetadata} from '../lib/page-metadata.ts';
import {SITE_URL,SOCIAL_IMAGE,catalogStructuredData,serializeStructuredData} from '../lib/seo.ts';
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function routeHtml(html,_origin,path){
 const meta=pageMetadata(path);
 let result=html.replace(/<title>.*?<\/title>/,`<title>${escape(meta.title)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(meta.description)}">`).replace(/<meta (?:property="og:[^"]+"|name="twitter:[^"]+"|name="robots")[^>]*>/g,'').replace(/<link rel="canonical"[^>]*>/g,'').replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,'');
 const canonical=`${SITE_URL}${meta.canonical||'/'}`;
 const extras=[`<meta name="robots" content="${meta.private?'noindex,nofollow':'index,follow'}">`,...(!meta.private?[`<link rel="canonical" href="${canonical}">`]:[]),`<meta property="og:type" content="website"><meta property="og:site_name" content="Plop Recibidas"><meta property="og:locale" content="es_AR"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:image" content="${SOCIAL_IMAGE}"><meta property="og:image:alt" content="Combo personalizado de Plop Recibidas"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(meta.title)}"><meta name="twitter:description" content="${escape(meta.description)}"><meta name="twitter:image" content="${SOCIAL_IMAGE}"><meta name="twitter:image:alt" content="Combo personalizado de Plop Recibidas">`,...(path==='/'?[`<script id="plop-structured-data" type="application/ld+json">${serializeStructuredData(catalogStructuredData())}</script>`]:[])].join('');
 result=result.replace('</head>',extras+'</head>');
 if(path==='/condiciones'){
  const content=`<main class="container privacy"><a href="/">Plop Recibidas</a><h1>Condiciones del pedido</h1><p>Los bloques marcados “COMPLETAR” están pendientes de definición por Plop. Consultanos antes de abonar.</p>${CONDITIONS.map(c=>`<section><h2>${escape(c.title)}</h2><p>${escape(c.text)}</p></section>`).join('')}<h2>Datos del vendedor</h2><p>Nombre o razón social: ${escape(SELLER.name)}<br>CUIT: ${escape(SELLER.cuit)}<br>Domicilio: ${escape(SELLER.address)}<br>Localidad: ${escape(SELLER.locality)}</p><a href="/">Volver al catálogo</a></main>`;
  result=result.replace(/<div id="root">[\s\S]*<\/body>/,`<div id="root">${content}</div></body>`);
 }
 if(path==='/')result=result.replace('<h1>Estamos abriendo Plop</h1>','<h1>Te recibís. Lo celebrás. Lo hacés con Plop.</h1>');
 return result;
}
export function writeRoutePages(directory,html){
 writeFileSync(`${directory}/index.html`,routeHtml(html,SITE_URL,'/'));
 writeFileSync(`${directory}/_pedido-shell.html`,routeHtml(html,SITE_URL,'/pedido/seguimiento'));
 writeFileSync(`${directory}/_campana-shell.html`,routeHtml(html,SITE_URL,'/campana/campana'));
 writeFileSync(`${directory}/404.html`,'<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página no encontrada | Plop Recibidas</title><meta name="robots" content="noindex,nofollow"></head><body><main><h1>No encontramos esta página</h1><p>Revisá el enlace o volvé al catálogo.</p><a href="/">Volver al inicio de Plop</a></main></body></html>');
 for(const path of ['/condiciones','/privacy','/privacidad','/admin','/admin/recuperar','/baja']){
  mkdirSync(directory+path,{recursive:true});writeFileSync(`${directory}${path}/index.html`,routeHtml(html,SITE_URL,path));
 }
}
