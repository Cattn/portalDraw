import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const parseOrigins = (originsString: string): string | string[] => {
	const origins = originsString.split(',').map((origin) => origin.trim());

	const isProduction = originsString.includes('https://');
	if (!isProduction) {
		origins.push('http://localhost:5024');
		origins.push('http://localhost:5173');
	}

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
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	},
	websocket: {
		cors: {
			origin: corsOrigins,
			methods: ['GET', 'POST'],
			credentials: true,
			allowedHeaders: ['Content-Type', 'Authorization']
		}
	},
	settings: {
		disableGlobalSettings: process.env.DISABLE_GLOBAL_SETTINGS === 'true'
	}
};
