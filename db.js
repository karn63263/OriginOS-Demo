const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'data');
fs.mkdirSync(dir, { recursive: true });
const db = new Database(process.env.DB_FILE || path.join(dir, 'origin.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  about TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_app_email ON applications(email);
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS stats (
  key TEXT PRIMARY KEY, label TEXT NOT NULL, value INTEGER NOT NULL, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, glyph TEXT, summary TEXT, stack TEXT,
  problem TEXT, solution TEXT, team TEXT, outcome_label TEXT, outcome TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, role TEXT, skills TEXT, mission TEXT,
  projects INTEGER DEFAULT 0, wins INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, xp INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT, icon TEXT, caption TEXT, category TEXT, meta TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT, year TEXT, title TEXT, body TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, status TEXT, description TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT, icon TEXT, text TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ori_faq (
  id INTEGER PRIMARY KEY AUTOINCREMENT, pattern TEXT NOT NULL, answer TEXT NOT NULL, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ori_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, matched INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
