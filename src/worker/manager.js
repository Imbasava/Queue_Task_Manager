// src/worker/manager.js
const { fork } = require("child_process");
const path = require("path");

function startWorkers(count = 1) {
  const children = new Map();

  const childScript = path.resolve(__dirname, "child.js");

  console.log(`Starting ${count} worker process(es)...`);

  for (let i = 0; i < count; i++) {
    spawnChild(i + 1);
  }

  function spawnChild(workerNum) {
    const child = fork(childScript, {
      stdio: ["inherit", "inherit", "inherit", "ipc"],
      env: { ...process.env, WORKER_NUM: `${workerNum}` },
    });

    children.set(child.pid, child);
    console.log(`→ Spawned worker #${workerNum} (pid=${child.pid})`);

    child.on("exit", (code, signal) => {
      children.delete(child.pid);
      console.log(`← Worker #${workerNum} (pid=${child.pid}) exited (code=${code}, signal=${signal})`);
      // If parent is still alive and not shutting down, restart child (optional)
      // For now do not auto-restart; you could choose to restart on non-zero exit.
    });

    child.on("error", (err) => {
      console.error(`Worker #${workerNum} (pid=${child.pid}) error:`, err);
    });
  }

  // Graceful shutdown: forward signals to children and wait for them to exit
  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\nManager: graceful shutdown requested — forwarding to children...");
    if (children.size === 0) {
      process.exit(0);
      return;
    }

    // Send SIGINT to all children
    for (const [, child] of children) {
      try {
        child.kill("SIGINT");
      } catch (e) {
        // ignore
      }
    }

    // Wait for children to exit (with timeout)
    const waitStart = Date.now();
    const timeoutMs = 20000; // 20s max wait
    while (children.size > 0 && Date.now() - waitStart < timeoutMs) {
      await new Promise((r) => setTimeout(r, 200));
    }

    if (children.size > 0) {
      console.log("Manager: forcing remaining children to terminate...");
      for (const [, child] of children) {
        try {
          child.kill("SIGTERM");
        } catch (e) {
          // ignore
        }
      }
    }
    console.log("Manager: all children terminated (or timeout). Exiting.");
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Also forward uncaught errors
  process.on("uncaughtException", (err) => {
    console.error("Manager uncaughtException:", err);
    shutdown();
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Manager unhandledRejection:", reason);
    shutdown();
  });

  // Keep the manager alive
  return {
    shutdown,
    children,
  };
}

module.exports = { startWorkers };
