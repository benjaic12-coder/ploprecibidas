import {quoteDate,type QuoteModel} from './quick-quote';
const cash=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
export async function quoteImage(q:QuoteModel):Promise<Blob>{
 const logo=new Image();logo.src='/brand/logo-original.webp';await logo.decode();
 const canvas=document.createElement('canvas');canvas.width=1080;
 const context=canvas.getContext('2d');if(!context)throw Error('Tu navegador no pudo preparar la imagen.');const ctx:CanvasRenderingContext2D=context;
 const operations:((()=>void))[]=[];let y=72;
 function text(value:string,x:number,top:number,size=28,bold=false,color='#243c39',align:CanvasTextAlign='left'){
  operations.push(()=>{ctx.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,top)});
 }
 function wrap(value:string,size=28,bold=false,color='#243c39',width=920){
  ctx.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`;
  const tokens=value.split(/\s+/).flatMap(word=>{const parts:string[]=[];let part='';for(const c of word){if(part&&ctx.measureText(part+c).width>width){parts.push(part);part=''}part+=c}if(part)parts.push(part);return parts});
  let line='';for(const word of tokens){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){text(line,80,y,size,bold,color);y+=size*1.4;line=word}else line=next}if(line){text(line,80,y,size,bold,color);y+=size*1.4}
 }
 operations.push(()=>ctx.drawImage(logo,72,48,300,150));
 text('PRESUPUESTO',1000,100,36,true,'#243c39','right');text(q.reference,1000,145,24,false,'#596c68','right');
 y=250;wrap('Tu recibida, con Plop.',49,true);y+=15;
 wrap('Emitido: '+quoteDate(q.issued)+' · Válido hasta: '+quoteDate(q.validUntil),25,false,'#596c68');
 if(q.customer)wrap('Para: '+q.customer,30,true);
 if(q.eventDate)wrap('Fecha de la recibida: '+quoteDate(q.eventDate),26);
 y+=30;
 for(const line of q.lines){wrap(`${line.quantity} × ${line.name}`,32,true);if(line.detail)wrap(line.detail,25,false,'#596c68');wrap(`${cash(line.price)} c/u · ${cash(line.lineTotal)}`,28,true,'#357970');y+=26}
 y+=15;wrap('Subtotal: '+cash(q.subtotal),30);
 if(q.discount)wrap(`Descuento ${q.discountPercent}%: −${cash(q.discount)}`,30,true,'#8064ac');
 y+=15;const boxY=y-55;operations.push(()=>{ctx.fillStyle='#e8f7f3';ctx.fillRect(64,boxY,952,100)});
 wrap('TOTAL   '+cash(q.total),48,true);y+=40;
 wrap('Seña del 50%: '+cash(q.deposit),29,true);wrap('Saldo de productos: '+cash(q.balance),29);y+=25;
 if(q.notes){wrap(q.notes,26);y+=20}
 wrap('Envío, si corresponde, se cotiza aparte. Sujeto a disponibilidad de fecha. Este presupuesto no reserva cupo ni acredita pagos.',24,false,'#596c68');y+=15;
 wrap('Registrá tu solicitud en la web. Confirmamos disponibilidad antes de la seña. El diseño puede definirse después.',24,false,'#596c68');y+=30;
 wrap('www.ploprecibidas.com.ar',31,true);wrap('@plop.recibidas',27,false,'#8064ac');y+=25;
 canvas.height=Math.ceil(y+40);ctx.fillStyle='#fffdf9';ctx.fillRect(0,0,1080,canvas.height);
 ['#57c4ba','#ff969b','#ffd748','#a494d0'].forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(i*270,0,270,12);ctx.fillRect(i*270,canvas.height-12,270,12)});
 for(const draw of operations)draw();
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No pudimos generar la imagen.')),'image/png'));
}
