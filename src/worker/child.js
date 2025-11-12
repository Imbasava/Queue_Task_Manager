#!/usr/bin/env node
// src/worker/child.js
// Simple wrapper that starts a single worker loop inside a child Node process.

const path = require("path");

// Adjust NODE_PATH to ensure local modules resolve correctly if needed
// But require relative modules directly:
const { runWorker } = require("./worker");

async function main() {
  try {
    await runWorker();
    // runWorker resolves only when worker exits (gracefully).
    process.exit(0);
  } catch (err) {
    console.error("Child worker crashed:", err);
    process.exit(1);
  }
}

main();
