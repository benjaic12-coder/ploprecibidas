import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const frame=(id,x,y,w,h)=>({role:'frame',file:`professional-20261017/${id}.jpg`,x,y,w,h});
const pic=(role,file,x,y,w,h,view)=>({role,file,x,y,w,h,view});
const props=(x,y,w,h)=>({...pic('props','thematic-components/props-neutral.png',x,y,w,h),count:8,original:true});
export const COMBO_LAYOUTS={
 'combo-1':{theme:'Medicina',color:'#74569a',parts:[frame('1000553495',20,70,750,660),pic('sign','thematic-components/medical-sign.jpg',795,100,365,590),props(180,780,840,370)]},
 'combo-2':{theme:'Nutrición',color:'#a7537b',optionalFrame:true,parts:[frame('1000553494',20,65,755,680),pic('band','thematic-components/nutrition-band.jpg',755,235,425,330,[0,350,1254,650]),props(200,790,800,340)]},
 'combo-3':{theme:'Odontología',color:'#b8507b',parts:[pic('banner','thematic-components/dentistry-banner.jpg',45,100,1110,630,[0,270,1254,720]),props(180,800,840,370)]},
 'combo-3-banda':{theme:'Odontología',color:'#b8507b',parts:[pic('banner','thematic-components/dentistry-banner.jpg',45,100,1110,630,[0,270,1254,720]),pic('band','thematic-components/dentistry-band.jpg',110,790,980,370,[0,325,1254,690])]},
 'combo-4':{theme:'Abogacía',color:'#334f74',optionalFrame:true,parts:[frame('1000553490',15,80,700,630),pic('band','thematic-components/law-band.jpg',740,235,430,340,[0,325,1254,690]),pic('banner','thematic-components/law-banner.jpg',35,780,600,310,[0,330,1254,610]),{...pic('props','thematic-components/props-law.png',665,720,490,430),count:8,original:true}]},
 'combo-5':{theme:'Kinesiología',color:'#ac467b',parts:[pic('sign','thematic-components/cartel-grande-studio.jpg',25,70,560,790,[0,0,1152,1152]),pic('banner','thematic-components/lona-grande-studio.jpg',505,290,670,650,[0,210,1152,750])]},
};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function composeCombo(id,root='public/products'){
 const layout=COMBO_LAYOUTS[id];let n=0;
 const parts=layout.parts.map(p=>{
  const path=resolve(root,p.file);const bytes=existsSync(path)?readFileSync(path):Buffer.from(JSON.parse(readFileSync('build/catalog-photos-professional-20261017.json','utf8'))[p.file.split('/').at(-1)],'base64');const mime=p.file.endsWith('.jpg')?'jpeg':p.file.endsWith('.png')?'png':'webp';
  const attrs=`data-role="${p.role}" data-source="${escape(p.file)}"${p.count?` data-count="${p.count}"`:''}${p.original?' data-original="true"':''}`;
  if(p.file.endsWith('props-neutral.png')){
   const id=`props-${++n}`;
   const outline='<path d="M16 42 L70 18 Q78 15 83 22 L95 48 Q95 54 87 57 L67 67 L63 74 Q58 79 52 73 L46 76 L26 79 Q20 78 18 69 L13 53Z M101 13 Q126 3 144 9 Q158 10 158 28 L158 47 Q155 55 160 66 L159 78 Q156 88 145 89 L109 90 Q99 89 98 73 L99 56 Q95 45 97 27Z M172 7 Q183 1 196 8 Q210 2 219 14 Q226 24 223 41 Q223 51 222 62 Q223 70 215 73 L202 73 L196 79 L184 80 L182 75 Q169 73 168 58 L168 27 Q166 15 172 7Z M231 25 Q243 14 256 13 L272 15 Q278 21 283 28 L285 37 L278 46 Q268 55 254 55 L241 50 L232 45 L235 36Z M279 53 Q288 50 292 61 Q307 52 312 64 Q310 68 316 70 Q329 77 319 90 L309 101 Q300 105 292 100 L274 90 Q267 86 271 75Z M141 100 Q166 97 174 99 Q191 96 201 100 Q205 103 204 124 Q205 134 197 136 L180 136 Q178 144 168 148 L160 148 L158 141 L163 136 L143 138 Q135 137 136 125 L136 109 Q136 103 141 100Z M40 114 Q46 110 56 116 L57 101 Q54 98 58 94 Q65 89 69 98 L69 102 L77 108 L85 97 Q84 92 88 90 Q94 88 97 95 L100 111 L106 126 Q107 132 101 135 L63 151 Q57 153 54 146 L43 129 Q36 126 37 120Z"/><ellipse cx="237" cy="95" rx="22" ry="22"/><path d="M60 71L63 71L80 104L77 105Z M128 87L132 87L137 142L133 142Z M191 76L195 76L196 101L192 101Z M248 53L252 54L245 80L241 79Z M280 97L284 99L263 140L259 138Z M230 113L234 114L229 168L225 168Z M167 143L171 143L173 177L169 177Z M80 143L84 142L104 177L100 177Z"/>';
   return `<svg x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" viewBox="0 0 334 177"><defs><clipPath id="${id}">${outline}</clipPath></defs><image ${attrs} href="data:image/png;base64,${bytes.toString('base64')}" width="334" height="177" clip-path="url(#${id})"/></svg>`;
  }
  if(!p.view)return `<image ${attrs} href="data:image/${mime};base64,${bytes.toString('base64')}" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" preserveAspectRatio="xMidYMid meet"/>`;
  const [vx,vy,vw,vh]=p.view,scale=Math.min(p.w/vw,p.h/vh),w=vw*scale,h=vh*scale,x=p.x+(p.w-w)/2,y=p.y+(p.h-h)/2;
  const clip=`part-${++n}`;const sourceW=p.file.includes('studio')?1152:1254;
  return `<defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${clip})"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vx} ${vy} ${vw} ${vh}"><image ${attrs} href="data:image/${mime};base64,${bytes.toString('base64')}" width="${sourceW}" height="${sourceW}"/></svg></g>`;
 }).join('');
 const note=layout.optionalFrame?'<text x="600" y="1178" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" fill="#654c60">Ejemplo con marco con forma · opcional (+$3.000)</text>':'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><title>${escape(id)} · ${layout.theme}</title><rect width="1200" height="1200" fill="#fffdf9"/><text x="45" y="48" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="${layout.color}">${layout.theme.toUpperCase()}</text>${parts}${note}</svg>`;
}
export async function writeThemedCombos(){
 const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
 const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp':'sharp');
 for(const id of Object.keys(COMBO_LAYOUTS))await sharp(Buffer.from(composeCombo(id))).webp({quality:92}).toFile(`public/products/${id}-tematico-v1.webp`);
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await writeThemedCombos();
