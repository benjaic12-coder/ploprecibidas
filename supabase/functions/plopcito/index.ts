import {createHandler} from './handler.ts';
Deno.serve(createHandler({SUPABASE_URL:Deno.env.get('SUPABASE_URL')!,SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,PLOPCITO_TELEGRAM_BOT_TOKEN:Deno.env.get('PLOPCITO_TELEGRAM_BOT_TOKEN')}));
