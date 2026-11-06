export type ApprovalOrder={uuid:string;id:string;status:string;is_test:boolean;archived_at?:string|null;reserved_at?:string|null;capacity_status?:string;created_at:string;customer:{name:string;date:string;notes?:string}};

export function pendingApprovals<T extends ApprovalOrder>(orders:T[]):T[]{
 return orders.filter(order=>{
  const technicalTest=/^PRUEBA\s+(?:WEB|TÉCNICA|TECNICA)\b/i.test(order.customer.name)||/PRUEBA T[ÉE]CNICA AUTORIZADA POR PLOP/i.test(order.customer.notes||'');
  if(order.is_test||technicalTest||order.archived_at||['cancelado','entregado'].includes(order.status))return false;
  return order.capacity_status==='pending'||(['nuevo','en_revision'].includes(order.status)&&!order.reserved_at);
 }).sort((a,b)=>(a.customer.date||'9999').localeCompare(b.customer.date||'9999')||a.created_at.localeCompare(b.created_at));
}

export const approvalKey=(order:ApprovalOrder)=>[order.uuid,order.customer.date,order.status,order.capacity_status||''].join('|');
export function approvalDate(date:string){return /^\d{4}-\d{2}-\d{2}$/.test(date)?date.split('-').reverse().join('/'):'Sin fecha informada';}
