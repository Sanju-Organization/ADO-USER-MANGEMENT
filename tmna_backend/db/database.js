import initSqlJs from 'sql.js';

let SQL = null;
let db = null;

class Database {
  constructor() {
    this.ready = this.initialize();
  }

  async initialize() {
    if (!SQL) {
      SQL = await initSqlJs();
    }
    db = new SQL.Database();
    this.createTables();
    return db;
  }

  createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'user',
        isDeleted INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `;
    try {
      db.run(schema);
    } catch (e) {
      console.log('Schema creation error', e);
    }
  }

  run(sql, params = []) {
    return db.run(sql, params);
  }

  prepare(sql) {
    return db.prepare(sql);
  }
}

export default Database;
