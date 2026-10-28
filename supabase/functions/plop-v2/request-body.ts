import {HttpError} from './errors.ts';
export async function boundedRequest(req:Request,maxBytes:number):Promise<Request>{
 if(!req.body)return req;
 const declared=Number(req.headers.get('content-length')||0);
 if(declared>maxBytes)throw new HttpError(413,'La solicitud supera el tamaño permitido. Reducí los archivos y volvé a intentar.');
 const reader=req.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new HttpError(413,'La solicitud supera el tamaño permitido. Reducí los archivos y volvé a intentar.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const headers=new Headers(req.headers);headers.delete('content-length');
 return new Request(req.url,{method:req.method,headers,body:bytes,signal:req.signal});
}

