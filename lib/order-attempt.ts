import type {CartItem} from './catalog.ts';
export type OrderAttempt={payload:string;files:File[];cart:CartItem[]};
export function orderAttempt(payload:unknown,files:File[],cart:CartItem[]):OrderAttempt{
 return {payload:JSON.stringify(payload),files:[...files],cart:JSON.parse(JSON.stringify(cart))};
}
export function attemptForm(attempt:OrderAttempt){const form=new FormData();form.set('payload',attempt.payload);attempt.files.forEach(file=>form.append('references',file));return form;}
