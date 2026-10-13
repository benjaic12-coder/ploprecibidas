export function paymentFormDefaults(total:number,deposit:number,paid:number){
 const type=paid<deposit?'sena':'saldo';
 return {type,amount:Math.max(0,(type==='sena'?deposit:total)-paid)};
}
