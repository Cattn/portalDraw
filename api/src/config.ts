import dotenv from 'dotenv';

dotenv.config();

// Debug environment variables
console.log('DEBUG: process.env.HOST =', process.env.HOST);
console.log('DEBUG: process.env.PORT =', process.env.PORT);
console.log('DEBUG: process.env.CORS_ORIGIN =', process.env.CORS_ORIGIN);

const parseOrigins = (originsString: string): string | string[] => {
  const origins = originsString.split(',').map(origin => origin.trim());
  return origins.length === 1 ? origins[0] : origins;
};

const corsOrigins = parseOrigins(process.env.CORS_ORIGIN || 'http://localhost:5173');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  database: {
    path: process.env.DB_PATH || 'portaldraw.sqlite'
  },
  cors: {
    origin: corsOrigins,
    credentials: false
  },
  websocket: {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"]
    }
  }
}; 