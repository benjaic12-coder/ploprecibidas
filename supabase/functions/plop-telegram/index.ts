import {createTelegramHandler} from './handler.ts';
Deno.serve(createTelegramHandler({SUPABASE_URL:Deno.env.get('SUPABASE_URL')!,SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,TELEGRAM_BOT_TOKEN:Deno.env.get('TELEGRAM_BOT_TOKEN')}));
