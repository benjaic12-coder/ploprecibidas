export type Testimonial={id?:string;nombre:string;carrera:string;texto:string;foto:string;autorizacion:boolean};
export function authorizedTestimonials(rows:unknown):Testimonial[]{
 if(!Array.isArray(rows))return [];
 return rows.filter((r):r is Testimonial=>!!r&&r.autorizacion===true&&['nombre','carrera','texto','foto'].every(k=>typeof r[k]==='string'&&r[k].trim()&&!r[k].includes('COMPLETAR'))&&/^\/(?!\/)/.test(r.foto)).slice(0,12);
}
