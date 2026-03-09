import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 从环境变量读取数据库路径，默认为 ./data/database.sqlite
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');

// 确保数据库目录存在
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    nickname TEXT UNIQUE,
    created_at TEXT,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT,
    created_at TEXT,
    completed_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

export default db;
