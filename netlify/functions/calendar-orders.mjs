import { hasAdminSession } from './_admin-auth.mjs';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default async request=>{
 if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
 if(!await hasAdminSession(request))return reply({error:'unauthorized'},401);
 const url=new URL(request.url),from=url.searchParams.get('from'),to=url.searchParams.get('to');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||'')||from>=to)return reply({error:'invalid_date_range'},400);
 const base=Netlify.env.get('SUPABASE_URL'),key=Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!base||!key)return reply({error:'backend_not_configured'},503);
 const params=new URLSearchParams({select:'id,code,contact,status,capacity_status,archived_at,created_at',order:'created_at.desc',limit:'1000'});
 const response=await fetch(base+'/rest/v1/plop_orders?'+params,{headers:{apikey:key,Authorization:'Bearer '+key}});
 const data=await response.json().catch(()=>null);
 if(!response.ok)return reply({error:'orders_query_failed'},502);
 if(!Array.isArray(data))return reply({error:'invalid_orders_response'},502);
 return reply({orders:data,complete:data.length<1000,from,to});
};
export const config={path:'/api/calendar-orders',method:['GET']};
