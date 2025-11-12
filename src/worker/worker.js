const { init } = require("../db/database");
const { runCommand } = require("../exec/runner");
 const { getConfig } = require("../storage/config");

 
async function runWorker() {
  console.log("👷 Worker started...");

  const db = init();
  let running = true;

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Graceful shutdown requested...");
    running = false;
  });

  while (running) {
    const now = new Date().toISOString();

    // Claim one pending job atomically
    const claimStmt = db.prepare(`
      UPDATE jobs
      SET state='processing',
          attempts = attempts + 1,
          updated_at = @now
      WHERE id = (
        SELECT id FROM jobs
        WHERE state='pending' AND run_after <= @now
        ORDER BY created_at ASC
        LIMIT 1
      )
      RETURNING *;
    `);

    const job = claimStmt.get({ now });

    if (!job) {
      // No jobs ready → sleep 2s
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    console.log(`🚀 Processing job: ${job.id} (${job.command})`);

    const { code, stdout, stderr } = await runCommand(job);
    const updated_at = new Date().toISOString();

    if (code === 0) {
      db.prepare(
        `UPDATE jobs SET state='completed', updated_at=@updated_at, stdout=@stdout, stderr=@stderr WHERE id=@id`
      ).run({ id: job.id, updated_at, stdout, stderr });
      console.log(`✅ Job completed: ${job.id}`);
    } else {
     

// Inside your failure block:
const maxRetries = job.max_retries || parseInt(getConfig("max-retries") || "3");
const base = parseInt(getConfig("backoff-base") || "2");

if (job.attempts < maxRetries) {
  const delaySeconds = Math.pow(base, job.attempts);
  const run_after = new Date(Date.now() + delaySeconds * 1000).toISOString();


        db.prepare(
          `UPDATE jobs SET state='pending', run_after=@run_after, updated_at=@updated_at,
           last_error=@stderr WHERE id=@id`
        ).run({ id: job.id, run_after, updated_at, stderr });
        console.log(`⚠️ Job failed (retry in ${delaySeconds}s): ${job.id}`);
      } else {
        db.prepare(
          `UPDATE jobs SET state='dead', updated_at=@updated_at, last_error=@stderr WHERE id=@id`
        ).run({ id: job.id, updated_at, stderr });
        console.log(`💀 Job moved to DLQ: ${job.id}`);
      }
    }
  }

  db.close();
  console.log("👋 Worker stopped gracefully.");
}

module.exports = { runWorker };
