const { init } = require("../db/database");

// Get value by key (returns string or undefined)
function getConfig(key) {
  const db = init();
  const stmt = db.prepare("SELECT value FROM config WHERE key = ?");
  const row = stmt.get(key);
  db.close();
  return row ? row.value : undefined;
}

// Set (insert or update) config key/value
function setConfig(key, value) {
  const db = init();
  const stmt = db.prepare(`
    INSERT INTO config (key, value)
    VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run({ key, value });
  db.close();
  return true;
}

// List all config pairs
function listConfig() {
  const db = init();
  const stmt = db.prepare("SELECT key, value FROM config");
  const rows = stmt.all();
  db.close();
  return rows;
}

// (Optional) clear all config keys
function resetConfig() {
  const db = init();
  const stmt = db.prepare("DELETE FROM config");
  const info = stmt.run();
  db.close();
  return info.changes;
}

module.exports = { getConfig, setConfig, listConfig, resetConfig };
