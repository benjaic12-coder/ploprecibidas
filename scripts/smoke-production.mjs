import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
const run=promisify(execFile),origin=process.env.SITE_URL||'https://plop-recibidas.pages.dev';
async function request(path){const {stdout}=await run('curl',['--location','--max-redirs','3','--silent','--show-error','--max-time','25','--dump-header','-','--write-out','\n%{http_code}',origin+path],{maxBuffer:4000000});const end=stdout.lastIndexOf('\n');const status=Number(stdout.slice(end+1)),raw=stdout.slice(0,end),split=raw.lastIndexOf('\r\n\r\n');return {path,status,headers:raw.slice(0,split),body:raw.slice(split+4)}}
const expected=[['/',200],['/admin',200],['/admin/recuperar',200],['/condiciones',200],['/privacidad',200],['/pedido/PLOP-AABBCCDDEEFF',200],['/auditoria-ruta-inexistente',404],['/api/admin',401],['/api/admin/session',401],['/api/catalog',200]];
const results=[];
for(let i=0;i<expected.length;i+=4)await Promise.all(expected.slice(i,i+4).map(async([path,status])=>{const r=await request(path);assert.equal(r.status,status,path);if(path==='/admin')assert.match(r.body,/noindex,nofollow/);if(path==='/condiciones'){assert.match(r.body,/<title>Condiciones/);assert.match(r.body,/COMPLETAR/)}results.push(r)}));
const home=results.find(r=>r.path==='/');assert.match(home.headers,/cache-control:.*(?:no-cache|max-age=0)/i);const deploy=/x-plop-deploy:\s*([^\r\n]+)/i.exec(home.headers)?.[1];
for(const r of results.filter(r=>r.status===200&&!r.path.startsWith('/api/')))assert.ok(r.headers.toLowerCase().includes('x-plop-deploy: '+deploy.toLowerCase()),'Deploy inconsistente '+r.path);
const catalog=JSON.parse(results.find(r=>r.path==='/api/catalog').body);assert.equal(catalog.products.length,18);assert.equal(catalog.checkoutEnabled,true);
const assets=[...new Set([...home.body.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(m=>m[1]))];for(const path of assets){const r=await request(path);assert.equal(r.status,200,path);assert.match(r.headers,/immutable/i)}
console.log(JSON.stringify({commit:deploy,checkoutEnabled:catalog.checkoutEnabled,products:catalog.products.length,routes:results.map(({path,status})=>({path,status})),entryAssets:assets},null,2));
