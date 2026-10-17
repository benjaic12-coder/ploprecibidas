import {readFileSync,writeFileSync} from 'node:fs';
const sources=new Map();
const source=(file)=>{if(sources.has(file))return sources.get(file);
 const data=readFileSync(`public/products/${file}`),mime=file.endsWith('.jpg')?'jpeg':'webp';
 const uri=`data:image/${mime};base64,${data.toString('base64')}`;sources.set(file,uri);return uri;};
// SVG only arranges embedded photographs: printed artwork is never generated.
let clipIndex=0;
const photo=(file,x,y,w,h,view,sourceW=491,sourceH=442)=>{
 const image=`<image data-original-source="${file}" xlink:href="${source(file)}" ${view?`width="${sourceW}" height="${sourceH}"`:`x="${x}" y="${y}" width="${w}" height="${h}"`} preserveAspectRatio="xMidYMid meet"/>`;
 if(!view)return image;
 const [,,vw,vh]=view.split(' ').map(Number),scale=Math.min(w/vw,h/vh),cw=vw*scale,ch=vh*scale;
 x+=(w-cw)/2;y+=(h-ch)/2;w=cw;h=ch;
 const id=`original-photo-${++clipIndex}`;
 return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${id})"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${view}" preserveAspectRatio="xMidYMid meet">${image}</svg></g>`;
};
const frame=(id,x,y,w,h)=>photo(`professional-20261017/${id}.jpg`,x,y,w,h);
const props=(x,y,w,h)=>photo('props.webp',x,y,w,h);
const band=(x,y,w,h)=>photo('banda.webp',x,y,w,h,'195 207 205 196');
const small=(x,y,w,h)=>photo('cartel-chico.webp',x,y,w,h);
const large=(x,y,w,h)=>photo('cartel-grande.webp',x,y,w,h);
// The two source lona photographs show the actual Forestry banner in use.
const lona=(x,y,w,h)=>photo('lona-grande.webp',x,y,w,h,'50 445 475 196',604,804);
const pinkLona=(x,y,w,h)=>photo('odontologia-foto-original.jpg',x,y,w,h,'56 602 578 260',691,1536);
const layouts={
 'combo-1':frame('1000553492',35,35,690,600)+small(740,110,225,300)+props(210,680,580,285),
 'combo-2':frame('1000553495',35,35,690,600)+band(745,145,215,360)+props(210,680,580,285),
 'combo-3':pinkLona(80,35,840,590)+props(200,690,600,280),
 'combo-3-banda':pinkLona(80,35,840,590)+band(330,680,340,285),
 'combo-4':frame('1000553619',30,20,640,490)+band(720,65,230,370)+lona(45,540,470,415)+props(550,630,405,290),
 'combo-5':large(70,40,360,350)+lona(255,440,700,520),
};
for(const [id,content] of Object.entries(layouts)){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="1000" viewBox="0 0 1000 1000"><title>${id}: composición con fotografías originales de Plop</title><rect width="1000" height="1000" fill="#fffdf9"/>${content}</svg>`;
 writeFileSync(`public/products/${id}-originales-v1.svg`,svg);
}
