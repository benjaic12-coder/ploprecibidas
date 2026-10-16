import {retainReleaseAssets} from './release-assets.mjs';
import {writeRoutePages} from './page-metadata.mjs';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','netlify.vite.config.ts','--outDir','../dist-cloudflare'],{stdio:'inherit'});
const deploy=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
writeFileSync('dist-cloudflare/deploy.json',JSON.stringify({commit:deploy}));
writeRoutePages('dist-cloudflare',readFileSync('dist-cloudflare/index.html','utf8'));
copyFileSync('cloudflare/_headers','dist-cloudflare/_headers');
writeFileSync('dist-cloudflare/_headers',readFileSync('dist-cloudflare/_headers','utf8')+`\n/*\n  X-Plop-Deploy: ${deploy}\n`);
writeFileSync('dist-cloudflare/_routes.json',JSON.stringify({version:1,include:['/api/*','/pedido/*','/campana/*'],exclude:[]}));

const retained=await retainReleaseAssets({directory:'dist-cloudflare',commit:deploy});
console.log(`Release resources: ${retained.releases} versions, ${retained.retained} retained chunks`);
