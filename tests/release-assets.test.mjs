import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {retainReleaseAssets,assetReferences} from '../scripts/release-assets.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
function fixture(){const directory=mkdtempSync(join(tmpdir(),'plop-release-'));mkdirSync(join(directory,'assets'));writeFileSync(join(directory,'assets/index-BBBBBBBB.js'),'new');return directory}
test('Una publicación conserva el JS anterior con su nombre y contenido originales',async()=>{
 const directory=fixture(),body=Buffer.from('previous');
 try{const result=await retainReleaseAssets({directory,commit:'b'.repeat(40),origin:'https://fixture.test',fetchResource:async url=>url.endsWith('asset-manifest.json')?{status:200,body:Buffer.from(JSON.stringify({version:1,releases:[{commit:'a'.repeat(40),assets:[{path:'/assets/index-AAAAAAAA.js',sha256:hash(body)}]}]}))}:{status:200,body}});
 assert.equal(result.releases,2);assert.equal(readFileSync(join(directory,'assets/index-AAAAAAAA.js'),'utf8'),'previous');assert.equal(JSON.parse(readFileSync(join(directory,'asset-manifest.json'))).releases.at(-1).commit,'b'.repeat(40));
 }finally{rmSync(directory,{recursive:true,force:true})}
});
test('Un manifiesto alterado no permite salir de assets ni publicar recursos corruptos',async()=>{
 for(const asset of [{path:'/assets/../secrets.js',sha256:'a'.repeat(64)},{path:'/assets/index-AAAAAAAA.js',sha256:'a'.repeat(64)}]){const directory=fixture();try{
 await assert.rejects(()=>retainReleaseAssets({directory,commit:'b'.repeat(40),origin:'https://fixture.test',fetchResource:async url=>url.endsWith('asset-manifest.json')?{status:200,body:Buffer.from(JSON.stringify({version:1,releases:[{commit:'a'.repeat(40),assets:[asset]}]}))}:{status:200,body:Buffer.from('corrupt')}}),/Invalid release asset|checksum mismatch/);
 }finally{rmSync(directory,{recursive:true,force:true})}}
});
test('La primera publicación recupera también los imports diferidos de la versión anterior',async()=>{
 const directory=fixture(),origin='https://12345678.plop-recibidas.pages.dev';
 const responses=new Map([[origin+'/',Buffer.from('<script src="/assets/index-AAAAAAAA.js"></script>')],[origin+'/assets/index-AAAAAAAA.js',Buffer.from('import("./panel-CCCCCCCC.js")')],[origin+'/assets/panel-CCCCCCCC.js',Buffer.from('export default 1')]]);
 try{await retainReleaseAssets({directory,commit:'b'.repeat(40),origin:'https://fixture.test',bootstrap:[{origin,commit:'a'.repeat(40)}],fetchResource:async url=>responses.has(url)?{status:200,body:responses.get(url)}:{status:404,body:Buffer.from('missing')}});
 assert.equal(readFileSync(join(directory,'assets/panel-CCCCCCCC.js'),'utf8'),'export default 1');
 assert.deepEqual(assetReferences('import("https://other.test/other-AAAAAAAA.js")'),[]);
 }finally{rmSync(directory,{recursive:true,force:true})}
});
