import {writeRoutePages} from './page-metadata.mjs';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','netlify.vite.config.ts','--outDir','../dist-cloudflare'],{stdio:'inherit'});
writeRoutePages('dist-cloudflare',readFileSync('dist-cloudflare/index.html','utf8'));
copyFileSync('cloudflare/_headers','dist-cloudflare/_headers');
writeFileSync('dist-cloudflare/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
