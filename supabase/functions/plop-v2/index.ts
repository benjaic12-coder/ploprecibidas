import {createHandler} from './backend.ts';
const handler=createHandler({SUPABASE_URL:Deno.env.get('SUPABASE_URL')!,SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY')!,SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,RESEND_API_KEY:Deno.env.get('RESEND_API_KEY'),EMAIL_FROM:Deno.env.get('EMAIL_FROM'),SITE_URL:Deno.env.get('SITE_URL'),META_ACCESS_TOKEN:Deno.env.get('META_ACCESS_TOKEN'),META_GRAPH_VERSION:Deno.env.get('META_GRAPH_VERSION')});
Deno.serve(handler);
