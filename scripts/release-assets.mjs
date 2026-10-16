// Keep content-addressed resources available across deployments. A stale HTML
// response or an open tab must still be able to import its original chunks.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const execute=promisify(execFile);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const validAsset=path=>typeof path==='string'&&/^\/assets\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8}\.(?:js|css)$/.test(path);
export function assetReferences(text){return [...new Set([...text.matchAll(/["'`](?:\.\/|\/?assets\/)([A-Za-z0-9_-]+-[A-Za-z0-9_-]{8}\.(?:js|css))["'`]/g)].map(m=>'/assets/'+m[1]))]}
async function request(url){
 const {stdout}=await execute('curl',['--silent','--show-error','--retry','1','--max-time','25','--write-out','\n%{http_code}',url],{encoding:'buffer',maxBuffer:8000000});
 const end=stdout.lastIndexOf(10);return {status:Number(stdout.subarray(end+1).toString()),body:stdout.subarray(0,end)};
}
async function batches(values,action){for(let i=0;i<values.length;i+=6)await Promise.all(values.slice(i,i+6).map(action))}
export async function retainReleaseAssets({directory,commit,origin='https://plop-recibidas.pages.dev',fetchResource=request,bootstrap=JSON.parse(readFileSync(new URL('./release-bootstrap.json',import.meta.url),'utf8'))}){
 const current=readdirSync(join(directory,'assets')).map(n=>'/assets/'+n).filter(validAsset).map(path=>({path,sha256:digest(readFileSync(join(directory,path)))}));
 const initial=await fetchResource(origin+'/asset-manifest.json');
 let releases=[];const buffers=new Map();
 if(initial.status===200){
  const manifest=JSON.parse(initial.body.toString());
  if(manifest.version!==1||!Array.isArray(manifest.releases)||manifest.releases.length>20)throw Error('Invalid release manifest');
  releases=manifest.releases;
 }else if(initial.status===404){
  // One-time bootstrap from known successful immutable deployments; not from
  // guessed URLs or a mutable source branch.
  for(const seed of bootstrap){
   if(!/^https:\/\/[a-f0-9]{8}\.plop-recibidas\.pages\.dev$/.test(seed.origin))throw Error('Invalid bootstrap origin');
   const html=await fetchResource(seed.origin+'/');if(html.status!==200)throw Error('Cannot read bootstrap deployment');
   let pending=assetReferences(html.body.toString());const assets=[],seen=new Set();
   while(pending.length){const next=[];
    await batches(pending,async path=>{if(seen.has(path))return;seen.add(path);if(seen.size>100)throw Error('Too many bootstrap chunks');
     const response=await fetchResource(seed.origin+path);if(response.status!==200)throw Error('Cannot read previous chunk '+path);
     const body=Buffer.from(response.body);assets.push({path,sha256:digest(body)});buffers.set(path,body);
     next.push(...assetReferences(body.toString()));
    });pending=[...new Set(next)].filter(p=>!seen.has(p));
   }
   releases.push({commit:seed.commit,assets});
  }
 }else throw Error('Cannot read release manifest; publication stopped to preserve previous resources');
 for(const release of releases){
  if(!/^[a-f0-9]{40}$/.test(release.commit)||!Array.isArray(release.assets)||release.assets.length>100)throw Error('Invalid release metadata');
  for(const asset of release.assets)if(!validAsset(asset.path)||!/^[a-f0-9]{64}$/.test(asset.sha256))throw Error('Invalid release asset');
 }
 const previous=releases.filter(r=>r.commit!==commit).slice(-19);
 const assets=new Map(previous.flatMap(r=>r.assets).map(a=>[a.path,a]));
 await batches([...assets.values()],async asset=>{
  const target=join(directory,asset.path);if(existsSync(target)){if(digest(readFileSync(target))!==asset.sha256)throw Error('Chunk collision');return;}
  let body=buffers.get(asset.path);if(!body){const response=await fetchResource(origin+asset.path);if(response.status!==200)throw Error('Missing retained chunk '+asset.path);body=Buffer.from(response.body);}
  if(digest(body)!==asset.sha256)throw Error('Retained chunk checksum mismatch');writeFileSync(target,body);
 });
 const result={version:1,releases:[...previous,{commit,assets:current}]};
 writeFileSync(join(directory,'asset-manifest.json'),JSON.stringify(result));
 return {releases:result.releases.length,retained:assets.size};
}
