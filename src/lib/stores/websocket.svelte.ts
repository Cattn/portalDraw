import { browser } from '$app/environment';
import type { WebSocketMessage } from '$lib/types';
import { baseURL } from '$lib/types';
import io, { type Socket } from 'socket.io-client';


interface SessionData {
	sessionId: string;
	sessionColor: string;
	boardId?: string;
}

interface CollaboratorData {
	sessionId: string;
	sessionColor: string;
}

interface CursorData {
	sessionId: string;
	sessionColor: string;
	cursor: { x: number; y: number };
}

interface SyncData {
	events: unknown[];
}

interface ErrorData {
	message?: string;
}

interface SocketMessage {
	type: 'session_joined' | 'session_left' | 'drawing_event' | 'cursor_move' | 'sync_request';
	payload: SessionData | CollaboratorData | CursorData | SyncData | ErrorData | unknown;
}

class WebSocketStore {
	private socket: Socket | null = null;
	connected = $state(false);
	connecting = $state(false);
	error = $state<string | null>(null);
	
	// Queue for operations that need to happen after connection
	private pendingBoardJoin: { boardId: string; sessionColor?: string } | null = null;
	
	// Message handlers that can be set by other stores
	private onDrawingEvent: ((event: any) => void) | null = null;
	private onCollaboratorJoined: ((data: CollaboratorData) => void) | null = null;
	private onCollaboratorLeft: ((data: CollaboratorData) => void) | null = null;
	private onCursorMove: ((data: CursorData) => void) | null = null;
	private onSyncEvents: ((events: any[]) => void) | null = null;
	
	connect() {
		if (!browser || this.connected) return;
		
		this.connecting = true;
		this.error = null;
		
		try {
			this.socket = io(baseURL, {
				transports: ['websocket', 'polling']
			});
			
			this.socket.on('connect', () => {
				this.connected = true;
				this.connecting = false;
				this.error = null;
				
				// Handle any pending board join
				if (this.pendingBoardJoin) {
					this.joinBoard(this.pendingBoardJoin.boardId, this.pendingBoardJoin.sessionColor);
					this.pendingBoardJoin = null;
				}
			});
			
			this.socket.on('disconnect', () => {
				this.connected = false;
				this.connecting = false;
			});
			
			this.socket.on('connect_error', (error: Error) => {
				this.error = 'Socket.IO connection failed';
				this.connecting = false;
				console.error('Socket.IO connection error:', error);
			});
			
			this.socket.on('session_joined', (data: SessionData) => {
				this.handleMessage({ type: 'session_joined', payload: data });
			});
			
			this.socket.on('collaborator_joined', (data: CollaboratorData) => {
				this.onCollaboratorJoined?.(data);
			});
			
			this.socket.on('collaborator_left', (data: CollaboratorData) => {
				this.onCollaboratorLeft?.(data);
			});
			
			this.socket.on('drawing_event', (event: unknown) => {
				this.onDrawingEvent?.(event);
			});
			
			this.socket.on('cursor_move', (data: CursorData) => {
				this.onCursorMove?.(data);
			});
			
			this.socket.on('sync_events', (events: unknown[]) => {
				this.onSyncEvents?.(events);
			});
			
			this.socket.on('error', (data: ErrorData) => {
				console.error('Socket.IO server error:', data);
				this.error = data.message || 'Server error';
			});
			
		} catch (error) {
			this.error = 'Failed to create Socket.IO connection';
			this.connecting = false;
			console.error('Socket.IO creation error:', error);
		}
	}
	
	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		this.pendingBoardJoin = null;
	}
	
	joinBoard(boardId: string, sessionColor?: string) {
		if (this.socket?.connected) {
			this.socket.emit('join_board', { boardId, sessionColor });
		} else {
			this.pendingBoardJoin = { boardId, sessionColor };
			
			// If not connecting, start connection
			if (!this.connecting && !this.connected) {
				this.connect();
			}
		}
	}
	
	send(message: WebSocketMessage) {
		if (this.socket?.connected) {
			// Extract the drawing event from the payload and send it directly
			if (message.type === 'drawing_event' && message.payload) {
				this.socket.emit('drawing_event', message.payload);
			} else {
				this.socket.emit(message.type, message.payload);
			}
		}
	}
	
	sendCursorMove(x: number, y: number) {
		if (this.socket?.connected) {
			this.socket.emit('cursor_move', { x, y });
		}
	}
	
	requestSync(boardId: string, fromSequence?: number) {
		if (this.socket?.connected) {
			this.socket.emit('sync_request', { boardId, fromSequence });
		}
	}
	
	// Set message handlers
	setDrawingEventHandler(handler: (event: any) => void) {
		this.onDrawingEvent = handler;
	}
	
	setCollaboratorJoinedHandler(handler: (data: CollaboratorData) => void) {
		this.onCollaboratorJoined = handler;
	}
	
	setCollaboratorLeftHandler(handler: (data: CollaboratorData) => void) {
		this.onCollaboratorLeft = handler;
	}
	
	setCursorMoveHandler(handler: (data: CursorData) => void) {
		this.onCursorMove = handler;
	}
	
	setSyncEventsHandler(handler: (events: any[]) => void) {
		this.onSyncEvents = handler;
	}
	
	private handleMessage(message: SocketMessage) {
		switch (message.type) {
			case 'drawing_event':
				this.onDrawingEvent?.(message.payload);
				break;
			case 'cursor_move':
				this.onCursorMove?.(message.payload as CursorData);
				break;
			case 'session_joined':
			case 'session_left':
				// These are handled by specific event handlers
				break;
			case 'sync_request':
				this.onSyncEvents?.((message.payload as SyncData).events);
				break;
		}
	}
}

export const websocketStore = new WebSocketStore(); 