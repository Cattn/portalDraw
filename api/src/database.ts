import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import winston from 'winston';
import { config } from './config';
import type { Board, DrawingEvent, BoardSession } from './types';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api.log' })
  ]
});

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(config.database.path, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        throw err;
      }
      logger.info('Connected to SQLite database');
    });
    
    this.db.configure('busyTimeout', 30000);
  }

  async initialize(): Promise<void> {
    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    try {
      const migrationFiles = await fs.readdir(migrationsDir);
      const sqlFiles = migrationFiles
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of sqlFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf-8');
        
        await new Promise<void>((resolve, reject) => {
          this.db.exec(sql, (err) => {
            if (err) {
              logger.error(`Error running migration ${file}:`, err);
              reject(err);
            } else {
              logger.info(`Migration ${file} completed`);
              resolve();
            }
          });
        });
      }
    } catch (error) {
      logger.error('Error running migrations:', error);
      throw error;
    }
  }

  // Board operations
  async getBoards(): Promise<Board[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM boards ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Board[]);
        }
      );
    });
  }

  async createBoard(board: Omit<Board, 'created_at' | 'updated_at'>): Promise<Board> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      this.db.run(
        `INSERT INTO boards (id, name, description, drawing_data, created_at, updated_at, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [board.id, board.name, board.description, board.drawing_data, now, now, board.is_public],
        function(err) {
          if (err) reject(err);
          else {
            resolve({
              ...board,
              created_at: new Date(now),
              updated_at: new Date(now)
            });
          }
        }
      );
    });
  }

  async getBoardById(id: string): Promise<Board | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM boards WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Board || null);
        }
      );
    });
  }

  async updateBoard(id: string, updates: Partial<Board>): Promise<void> {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`);
    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE boards SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
        [...values, now, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Drawing events operations
  async saveDrawingEvent(event: DrawingEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO drawing_events (id, board_id, session_id, event_type, event_data, sequence_number, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.boardId,
          event.sessionId,
          event.type,
          JSON.stringify(event.data),
          event.sequence,
          new Date(event.timestamp).toISOString()
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getDrawingEvents(boardId: string, fromSequence?: number): Promise<DrawingEvent[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM drawing_events WHERE board_id = ?';
      const params: any[] = [boardId];

      if (fromSequence !== undefined) {
        query += ' AND sequence_number > ?';
        params.push(fromSequence);
      }

      query += ' ORDER BY sequence_number ASC';

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const events = rows.map(row => ({
            id: row.id,
            boardId: row.board_id,
            sessionId: row.session_id,
            type: row.event_type,
            data: JSON.parse(row.event_data),
            sequence: row.sequence_number,
            timestamp: new Date(row.timestamp).getTime()
          }));
          resolve(events);
        }
      });
    });
  }

  // Board sessions operations
  async createSession(session: Omit<BoardSession, 'joinedAt' | 'lastSeen'>): Promise<BoardSession> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      this.db.run(
        `INSERT INTO board_sessions (id, board_id, socket_id, session_color, joined_at, last_seen)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [session.id, session.boardId, session.socketId, session.sessionColor, now, now],
        function(err) {
          if (err) reject(err);
          else {
            resolve({
              ...session,
              joinedAt: new Date(now),
              lastSeen: new Date(now)
            });
          }
        }
      );
    });
  }

  async updateSessionActivity(sessionId: string, cursor?: { x: number; y: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      let query = 'UPDATE board_sessions SET last_seen = ?';
      const params: any[] = [now];

      if (cursor) {
        query += ', cursor_x = ?, cursor_y = ?';
        params.push(cursor.x, cursor.y);
      }

      query += ' WHERE id = ?';
      params.push(sessionId);

      this.db.run(query, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getActiveSessions(boardId: string): Promise<BoardSession[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM board_sessions 
         WHERE board_id = ? AND last_seen > datetime('now', '-5 minutes')
         ORDER BY joined_at ASC`,
        [boardId],
        (err, rows: any[]) => {
          if (err) reject(err);
          else {
            const sessions = rows.map(row => ({
              id: row.id,
              boardId: row.board_id,
              socketId: row.socket_id,
              sessionColor: row.session_color,
              joinedAt: new Date(row.joined_at),
              lastSeen: new Date(row.last_seen),
              cursor: row.cursor_x && row.cursor_y ? { x: row.cursor_x, y: row.cursor_y } : undefined
            }));
            resolve(sessions);
          }
        }
      );
    });
  }

  async removeSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM board_sessions WHERE id = ?',
        [sessionId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  close(): void {
    this.db.close((err) => {
      if (err) {
        logger.error('Error closing database:', err);
      } else {
        logger.info('Database connection closed');
      }
    });
  }
} 