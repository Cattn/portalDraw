import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  database: {
    path: process.env.DB_PATH || 'portaldraw.sqlite'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  websocket: {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ["GET", "POST"]
    }
  }
}; 