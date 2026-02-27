App A (torrentToTrakt) ─┐
App B (radarrCleanup)   ├──> Supabase (app_message_queue)
App C (any service)     ┘

                        ↓

                 Message Worker
                        ↓
           Telegram / Webhook / Email