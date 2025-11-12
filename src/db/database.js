const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');


const DB_PATH = path.resolve(__dirname, '../../data/queuectl.sqlite3');


function init() {
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
const migration = fs.readFileSync(path.resolve(__dirname, './migrations.sql'), 'utf8');
db.exec(migration);

// ✅ Safe schema migration: add missing columns if needed
const existingCols = db.prepare("PRAGMA table_info(jobs)").all().map(c => c.name);

if (!existingCols.includes("priority")) {
  db.exec("ALTER TABLE jobs ADD COLUMN priority INTEGER DEFAULT 0;");
  console.log("✅ Added missing column: priority");
}

if (!existingCols.includes("duration")) {
  db.exec("ALTER TABLE jobs ADD COLUMN duration REAL;");
  console.log("✅ Added missing column: duration");
}

return db;
}


module.exports = { init, DB_PATH };
