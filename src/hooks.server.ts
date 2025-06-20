import type { Handle } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';

export const handle: Handle = async ({ event, resolve }) => {
  if (!event.locals.db) {
    const db = new sqlite3.Database('db.sqlite', (err: Error | null) => {
      if (err) {
        throw err;
      }
    });
    
    event.locals.db = db
    
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        admin BOOLEAN DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        preview TEXT,
        userId INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS strokes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boardId TEXT,
        points TEXT NOT NULL,
        color TEXT NOT NULL,
        width INTEGER NOT NULL,
        FOREIGN KEY (boardId) REFERENCES boards(id)
      )`
    ];

    queries.forEach(query => {
      db.run(query, (err: Error | null) => {
        if(err) {
          throw err
        }
      });
    });
  }
  const resp = await resolve(event);
  return resp;
};