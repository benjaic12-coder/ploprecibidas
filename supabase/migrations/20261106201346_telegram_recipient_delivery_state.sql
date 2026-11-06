-- Per-recipient progress stays inside the existing RLS-protected notification table.
ALTER TABLE public.plop_telegram_notifications
 ADD COLUMN IF NOT EXISTS delivery_state jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.plop_telegram_notifications
 ADD CONSTRAINT plop_telegram_delivery_state_object CHECK (jsonb_typeof(delivery_state)='object');
