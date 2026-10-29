import {z} from 'zod';
import {HttpError} from './errors.ts';
export function selectionReference(value:unknown){if(value===undefined||value===null||value==='')return null;const id=String(value).trim().replace(/^SEL-/i,'');if(!z.string().uuid().safeParse(id).success)throw new HttpError(400,'Copiá la referencia SEL- completa de la selección.');return id.toLowerCase();}
export async function selectionAttribution(rest:(path:string,options?:RequestInit)=>Promise<any>,id:string){
 const rows=await rest('plop_events?selection_ref=eq.'+id+'&event=eq.selection_whatsapp&select=session_id,source,campaign,device&order=occurred_at.desc&limit=1000');
 if(!rows.length||rows.length>=1000||new Set(rows.map((r:any)=>r.session_id)).size!==1)return null;
 const e=rows[0];return {source:e.source,utm_campaign:e.campaign,device:e.device,sessionId:e.session_id,analyticsConsent:true,adsConsent:false};
}
