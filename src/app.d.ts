import type { Database } from 'sqlite3'
import type { Board } from '$lib/types'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: Database;
		}
		interface PageData {
			boards?: Board[];
		}
		// interface PageState {}
		// interface Platform {}
		
		interface WebSocketMessage {
			type: string;
			payload: Record<string, unknown>;
			boardId?: string;
			userId?: string;
			timestamp: number;
		}
		
		interface SocketConnection {
			id: string;
			userId?: string;
			boardId?: string;
			socket: import('ws').WebSocket;
		}
	}
}

export {};
