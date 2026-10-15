export type Product = { id:string; name:string; category:string; price:number; image:string; description:string; dimensions:string; material:string; includes:string; available:boolean; imageKind?:string; badge?:string; regular?:number; frameOption?:boolean; choiceOption?:boolean };
const base = (id:string,name:string,category:string,price:number,description:string,dimensions:string,material:string,extras:Partial<Product>={}):Product => ({id,name,category,price,image:`/products/${id}.webp`,description,dimensions,material,includes:'Diseño personalizado incluido',available:true,imageKind:'Imagen ilustrativa de referencia',...extras});
export const PRODUCTS:Product[]=[
base('combo-1','Combo 1','Combos',50000,'El primer paso para una recibida que se siente tuya.','Marco 100 × 70 cm · cartel 25 × 35 cm','Plástico corrugado, vinilo y papel',{includes:'Marco rectangular + cartel colgante chico + 8 props',badge:'Para empezar',regular:54000,frameOption:true}),
base('combo-2','Combo 2','Combos',55000,'Todos los detalles para ser protagonista.','Marco 100 × 70 cm · banda 150 × 11 cm','Plástico corrugado, vinilo, lona y papel',{includes:'Marco rectangular + banda para graduados + 8 props',badge:'Un favorito',regular:59000,frameOption:true}),
base('combo-3','Combo 3','Combos',34000,'Una lona para celebrar, con el detalle que vos elegís.','Lona 100 × 60 cm','Lona impresa; props de papel o banda de lona',{includes:'Lona mediana + 8 props o banda para graduados',regular:37000,choiceOption:true}),
base('combo-4','Combo 4','Combos',76000,'Un gran momento merece el combo completo.','Marco 100 × 70 cm · lona 140 × 60 cm','Plástico corrugado, vinilo, lona y papel',{includes:'Marco rectangular + banda + 8 props + lona grande',badge:'Todo en uno',regular:89000,frameOption:true}),
base('combo-5','Combo 5','Combos',54000,'Para que tu alegría se vea desde lejos.','Cartel 70 × 100 cm · lona 140 × 60 cm','Plástico corrugado, vinilo y lona',{includes:'Cartel colgante grande + lona grande',regular:60000}),
base('marco-selfie','Marco rectangular','Marcos',35000,'Tu nombre, tu carrera y todos tus recuerdos en un marco.','100 × 70 cm','Plástico corrugado y vinilo',{badge:'Clásico Plop',image:'https://lzbohzakmntypeejgquf.supabase.co/storage/v1/object/public/plop-catalog-v2/marco-selfie-5bdd8d1d476f37823afc636d27048633.png',imageKind:'Foto original · diseño de referencia'}),
base('marco-redondo','Marco redondo','Marcos',38000,'Una forma diferente de enmarcar tu gran día.','90 × 90 cm · diámetro 90 cm','Plástico corrugado y vinilo',{image:'/products/marco-nube.webp',imageKind:'Foto original · diseño de referencia'}),
base('marco-nube','Marco tipo nube','Marcos',38000,'Suave, divertido y con toda tu personalidad.','Aproximadamente 50 × 100 cm','Plástico corrugado y vinilo',{image:'/products/cartel-forma.webp',imageKind:'Foto original · diseño de referencia'}),
base('marco-forma','Marco con forma','Marcos',38000,'Dale a tu recibida la silueta que imaginás.','Máximo 100 × 70 cm · forma a coordinar','Plástico corrugado y vinilo',{image:'https://lzbohzakmntypeejgquf.supabase.co/storage/v1/object/public/plop-catalog-v2/marco-forma-7d69c3584ba8b70b385fbc488f1a3682.png',imageKind:'Foto original · diseño de referencia'}),
base('banda','Banda para graduados','Bandas',12000,'Elegí los colores y la frase: hoy te toca brillar.','150 × 11 cm','Lona impresa con doble costura'),
base('cartel-chico','Cartel colgante chico','Carteles',7000,'Liviano y listo para acompañarte.','25 × 35 cm','Plástico corrugado y vinilo',{includes:'Diseño personalizado + cinta para colgar'}),
base('cartel-mediano','Cartel colgante mediano','Carteles',12000,'El detalle perfecto para tus fotos.','40 × 60 cm','Plástico corrugado y vinilo',{includes:'Diseño personalizado + cinta para colgar'}),
base('cartel-grande','Cartel colgante grande','Carteles',30000,'Una frase que merece verse a lo grande.','70 × 100 cm','Plástico corrugado y vinilo',{includes:'Diseño personalizado + cinta para colgar'}),
base('cartel-forma','Cartel con forma','Carteles',18000,'Tu idea recortada con una silueta especial.','Máximo 40 × 60 cm','Plástico corrugado y vinilo',{image:'/products/cartel-forma.svg',imageKind:'Esquema ilustrativo · forma a coordinar',includes:'Diseño personalizado + cinta'}),
base('lona-mediana','Lona mediana','Lonas',25000,'Para el auto, la fiesta o tus mejores fotos.','100 × 60 cm','Lona impresa'),
base('lona-grande','Lona grande','Lonas',30000,'Un fondo para una historia enorme.','140 × 60 cm','Lona impresa'),
base('prop','Prop individual','Props',2000,'Tu meme, tu foto o esa frase que siempre decís.','Aproximadamente 15 × 21 cm','Papel impreso',{includes:'1 prop personalizado con palito, listo para usar'}),
base('props','Pack de 8 props','Props',12000,'Ocho ideas para multiplicar los recuerdos.','Aproximadamente 15 × 21 cm cada uno','Papel impreso',{includes:'8 props personalizados con palitos'})
].map(p=>({...p,image:p.id==='cartel-forma'?'/products/cartel-forma-mejorado.webp':p.id.startsWith('combo-')?`/products/${p.id}-coordinated.webp`:`/products/${p.id}-studio.webp`,imageKind:p.id==='cartel-forma'?'Imagen retocada · diseño de referencia':p.id.startsWith('combo')?'Composición ilustrativa · diseño de referencia':'Imagen retocada · diseño de referencia'}));
export const CATEGORIES=['Todo','Combos','Marcos','Bandas','Carteles','Lonas','Props'];
export const money=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
export type Customization={names:string;career:string;colors:string;phrase:string;frame:string;choice:string;size:string};
export type CartItem={key:string;productId:string;quantity:number;custom:Customization};
export const emptyCustom=():Customization=>({names:'',career:'',colors:'',phrase:'',frame:'Rectangular',choice:'8 props',size:'90 cm'});
export function unitPrice(p:Product,c:Customization){return p.price+(p.frameOption&&c.frame!=='Rectangular'?3000:0);}
const catalogRank=new Map(PRODUCTS.map((p,index)=>[p.id,index]));
export function recommendedOrder(a:Product,b:Product){
 return (catalogRank.get(a.id)??Number.MAX_SAFE_INTEGER)-(catalogRank.get(b.id)??Number.MAX_SAFE_INTEGER)||a.name.localeCompare(b.name,'es-AR');
}
export function personalizedDimensions(p:Product,c:Customization){
 if(p.id==='marco-redondo')return `Diámetro ${c.size}`;
 if(!p.frameOption)return p.dimensions;
 const frame=c.frame==='Redondo'?`Marco redondo · diámetro ${c.size}`:c.frame==='Tipo nube'?'Marco tipo nube · aproximadamente 50 × 100 cm':c.frame==='Con forma'?'Marco con forma · máximo 100 × 70 cm · forma a coordinar':'Marco 100 × 70 cm';
 return p.dimensions.replace(/^Marco 100 × 70 cm/,frame);
}
export function personalizedIncludes(p:Product,c:Customization){
 let includes=p.includes;
 if(p.frameOption)includes=includes.replace(/Marco rectangular/i,`Marco ${c.frame.toLowerCase()}`);
 if(p.choiceOption)includes=`Lona mediana + ${c.choice==='Banda'?'banda para graduados':'8 props'}`;
 return includes;
}
export function localToday(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Cordoba',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function earliestDate(days=7,now=new Date()){const date=new Date(`${localToday(now)}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);}

// Calendar days in Argentina: same-day and next-day orders are not accepted.
export const MIN_ORDER_LEAD_DAYS=2;
