import pool from "./config/db.js";
import { sendTelegramMessage } from "./senders/telegram.js";

async function processBatch() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(`
      SELECT *
      FROM app_message_queue
      WHERE status = 'pending'
        AND scheduled_at <= NOW()
      ORDER BY created_at
      LIMIT 20
      FOR UPDATE SKIP LOCKED
    `);

    for (const msg of rows) {
      try {
        await client.query(
          `UPDATE app_message_queue
           SET status = 'processing'
           WHERE id = $1`,
          [msg.id]
        );

        // Dispatch based on target
        if (msg.target === "telegram") {
          await sendTelegramMessage(msg.payload.message);
        }

        await client.query(
          `UPDATE app_message_queue
           SET status = 'sent',
               processed_at = NOW()
           WHERE id = $1`,
          [msg.id]
        );

      } catch (err) {

        await client.query(
          `
          UPDATE app_message_queue
          SET retry_count = retry_count + 1,
              status =
                CASE
                  WHEN retry_count + 1 >= max_retries
                  THEN 'failed'
                  ELSE 'pending'
                END
          WHERE id = $1
          `,
          [msg.id]
        );
      }
    }

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Worker crash:", err.message);
  } finally {
    client.release();
  }
}

export function startWorker(intervalMs = 10000) {
  console.log("🚀 Message Worker started...");
  setInterval(processBatch, intervalMs);
}