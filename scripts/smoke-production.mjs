import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const run=promisify(execFile),origin=process.env.SITE_URL||'https://plop-recibidas.pages.dev';
const assetOrigin=process.env.ASSET_ORIGIN||origin;
async function request(path,base=origin){const {stdout}=await run('curl',['--location','--max-redirs','3','--silent','--show-error','--max-time','25','--dump-header','-','--write-out','\n%{http_code}',base+path],{maxBuffer:4000000});const end=stdout.lastIndexOf('\n');const status=Number(stdout.slice(end+1)),raw=stdout.slice(0,end),split=raw.lastIndexOf('\r\n\r\n');return {path,status,headers:raw.slice(0,split),body:raw.slice(split+4)}}
async function verifyProduction(){
const expected=[['/',200],['/admin',200],['/admin/recuperar',200],['/condiciones',200],['/privacidad',200],['/pedido/PLOP-AABBCCDDEEFF',200],['/auditoria-ruta-inexistente',404],['/api/admin',401],['/api/admin/session',401],['/api/catalog',200]];
const results=[];
for(let i=0;i<expected.length;i+=4)await Promise.all(expected.slice(i,i+4).map(async([path,status])=>{const r=await request(path);assert.equal(r.status,status,path);if(path==='/admin')assert.match(r.body,/noindex,nofollow/);if(path==='/condiciones'){assert.match(r.body,/<title>Condiciones/);assert.doesNotMatch(r.body,/COMPLETAR/)}results.push(r)}));
const home=results.find(r=>r.path==='/');assert.match(home.headers,/cache-control:.*(?:no-cache|max-age=0)/i);const deploy=/x-plop-deploy:\s*([^\r\n]+)/i.exec(home.headers)?.[1];
if(process.env.EXPECTED_DEPLOY_SHA)assert.equal(deploy,process.env.EXPECTED_DEPLOY_SHA,'Published commit differs from the checked commit');
for(const r of results.filter(r=>r.status===200&&!r.path.startsWith('/api/')))assert.ok(r.headers.toLowerCase().includes('x-plop-deploy: '+deploy.toLowerCase()),'Deploy inconsistente '+r.path);
const catalog=JSON.parse(results.find(r=>r.path==='/api/catalog').body);assert.equal(catalog.products.length,18);assert.equal(catalog.checkoutEnabled,true);
const assets=[...new Set([...home.body.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(m=>m[1]))];for(const path of assets){const r=await request(path);assert.equal(r.status,200,path);assert.match(r.headers,path.includes('?plop-domain=')?/no-cache/i:/immutable/i)}
const manifestResponse=await request('/asset-manifest.json');assert.equal(manifestResponse.status,200);const manifest=JSON.parse(manifestResponse.body);assert.equal(manifest.releases.at(-1).commit,deploy,'Deploy manifest inconsistent');
for(let i=0;i<manifest.releases.length-1;i+=4)await Promise.all(manifest.releases.slice(i,Math.min(i+4,manifest.releases.length-1)).map(async release=>{const entry=release.assets.find(a=>/^\/assets\/index-.*\.js$/.test(a.path));assert.ok(entry,'Previous entry missing');const r=await request(entry.path,assetOrigin);assert.equal(r.status,200,entry.path);assert.equal(createHash('sha256').update(r.body).digest('hex'),entry.sha256,'Previous JS checksum '+entry.path)}));
console.log(JSON.stringify({retainedReleases:manifest.releases.length-1,commit:deploy,checkoutEnabled:catalog.checkoutEnabled,products:catalog.products.length,routes:results.map(({path,status})=>({path,status})),entryAssets:assets},null,2));
}
// Different requests may reach different Pages locations during propagation.
// Retry only revision mismatches; status, content, auth and checksum failures remain fatal.
for(let attempt=0;attempt<12;attempt++){
  try{await verifyProduction();break;}
  catch(error){
    if(!process.env.EXPECTED_DEPLOY_SHA||attempt===11||!/(Published commit differs|Deploy inconsistente|Deploy manifest inconsistent)/.test(error.message))throw error;
    console.log(`Waiting for consistent production revision (${attempt+1}/12)`);
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
}
