# Telegram: multiple private recipients

The deployed dispatcher preserves `telegram_internal.chatId` as the primary recipient and also reads `chatIds`. Values are validated and deduplicated. Actual recipient IDs remain in the protected database, never in source.

Each new notification snapshots its recipients in `delivery_state`. Sends are recorded independently. A retry only resends explicit provider rejections. Successful and uncertain deliveries are never automatically repeated. Progress is marked uncertain before sending, so a crash between provider acceptance and persistence cannot cause automatic duplicates. Existing sent jobs remain closed; adding recipients does not replay historical orders.

Validation: 9 focused tests cover single-recipient compatibility, two recipients, partial rejection, network uncertainty, persistence interruption, concurrent claims, completed legacy jobs, and date/amount content.

Deploy the additive migration before publishing `plop-telegram`. Keep `verify_jwt=false`: the handler authenticates the individual queue job using its ID and unguessable request token, as before. No table grants or RLS policies change.

Rollback: first restore the prior `telegram_internal` configuration (remove the extra chatIds), then redeploy index.ts with the saved handler in docs/releases/telegram-handler-before-multiple-20261106.ts as handler.ts. Retain the additive JSON column and its delivery evidence. Do not reset or replay notification jobs. Deploying the old handler while partial jobs are pending requires manual review because the old version ignores per-recipient progress.
