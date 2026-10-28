type Item={productId:string;custom?:Record<string,string>};
export function designPending(item:Item){return ['names','career','colors','phrase'].some(key=>!item.custom?.[key]?.trim())}
export function itemOptions(item:Item){
 const c=item.custom||{},id=item.productId;
 const fixed:Record<string,string>={'marco-selfie':'Marco rectangular · 100 × 70 cm','marco-nube':'Marco tipo nube · aproximadamente 50 × 100 cm','marco-forma':'Marco con forma · máximo 100 × 70 cm','banda':'150 × 11 cm','cartel-chico':'25 × 35 cm','cartel-mediano':'40 × 60 cm','cartel-grande':'70 × 100 cm','cartel-forma':'Máximo 40 × 60 cm · forma a coordinar','lona-mediana':'100 × 60 cm','lona-grande':'140 × 60 cm','prop':'1 prop personalizado','props':'Pack de 8 props'};
 if(id==='marco-redondo')return 'Marco redondo · diámetro '+(c.size||'a confirmar');
 if(['combo-1','combo-2','combo-4'].includes(id))return 'Marco '+(c.frame||'Rectangular')+(c.frame==='Redondo'?' · diámetro '+(c.size||'a confirmar'):'');
 if(id==='combo-3')return c.choice==='Banda'?'Lona mediana + banda para graduados':'Lona mediana + 8 props';
 return fixed[id]||'';
}
export function itemColors(item:Item,designApproved=false){
 const c=item.custom||{};
 if(!c.colors?.trim())return 'A definir con el cliente';
 if(!designApproved&&c.colors==='Rosa + aqua'&&!c.names&&!c.career&&!c.phrase)return 'Por confirmar · valor inicial registrado: Rosa + aqua';
 return c.colors;
}
