// Pages treats repeated route blocks as replacements. Keep the revision in
// the existing global block so CSP and other protections remain effective.
export function releaseHeaders(source,commit){
 if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Invalid deployment revision');
 const clean=source.replace(/^  X-Plop-Deploy:.*\n/gm,'');
 if(!clean.startsWith('/*\n'))throw Error('Missing global security headers');
 return clean.replace('/*\n',`/*\n  X-Plop-Deploy: ${commit}\n`);
}
