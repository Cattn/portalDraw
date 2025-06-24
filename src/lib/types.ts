import { PUBLIC_PORT } from '$env/static/public';

export function getBaseURL(): string {
	if (typeof window !== 'undefined') {
		const protocol = window.location.protocol;
		const hostname = window.location.hostname;
		const port = PUBLIC_PORT || '3001';
		const defaultPort = protocol === 'https:' ? '443' : '80';
		
		// In production with HTTPS, don't append port if using standard port or if port matches default
		if (protocol === 'https:' && (port === '443' || port === defaultPort)) {
			return `${protocol}//${hostname}`;
		}
		
		return port !== defaultPort ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
	} else {
		// Server-side: Use the same URL as the client would use
		if (process.env.NODE_ENV === 'production') {
			// In production, determine protocol and hostname from CORS_ORIGIN
			const corsOrigin = process.env.CORS_ORIGIN;
			if (corsOrigin) {
				const firstOrigin = corsOrigin.split(',')[0].trim();
				const url = new URL(firstOrigin);
				const publicPort = process.env.PUBLIC_PORT || '3001';
				
				// Use the same protocol and hostname, with the public port
				if (url.protocol === 'https:' && publicPort === '443') {
					return `${url.protocol}//${url.hostname}`;
				}
				return `${url.protocol}//${url.hostname}:${publicPort}`;
			}
		}
		// Development fallback
		const apiPort = process.env.PORT || '3001';
		return `http://localhost:${apiPort}`;
	}
}

export const baseURL = getBaseURL();
export interface Board {
	id: string;
	name: string;
	description?: string;
	drawing_data: string;
	created_at: Date;
	updated_at: Date;
	is_public: boolean;
}

export interface Stroke {
    id: number;
    boardId: number;
    points: string;
    color: string;
    width: number;
}

export interface DrawingEvent {
	id: string;
	boardId: string;
	sessionId: string;
	type: 'stroke' | 'erase' | 'clear' | 'undo' | 'redo' | 'cursor' | 'stroke_deleted';
	data: DrawingStroke | Point | { layers?: string[] } | { strokeIds?: string[] } | Record<string, unknown>;
	timestamp: number;
	sequence: number;
}

export interface DrawingStroke {
	id: string;
	points: Point[];
	color: string;
	width: number;
	tool: DrawingTool;
	sessionId: string;
	timestamp: number;
}

export interface Point {
	x: number;
	y: number;
	pressure?: number;
}

export interface DrawingTool {
	type: 'pen' | 'eraser' | 'stroke_eraser' | 'highlighter' | 'text' | 'hand';
	size: number;
	opacity: number;
}

export interface BoardSession {
	id: string;
	boardId: string;
	socketId: string;
	sessionColor: string;
	joinedAt: Date;
	lastSeen: Date;
	cursor?: Point;
}

export interface Collaborator {
	id: string;
	sessionColor: string;
	cursor?: Point;
	isOnline: boolean;
}

export interface WebSocketMessage {
	type: 'drawing_event' | 'cursor_move' | 'session_joined' | 'session_left' | 'sync_request';
	payload: DrawingEvent | Point | Collaborator | { message?: string } | Record<string, unknown>;
	boardId: string;
	sessionId: string;
	timestamp: number;
}

// Settings types
export interface AppSettings {
	version: string;
	exportDate?: string;
	drawing: DrawingSettings;
	ui: UISettings;
	collaboration: CollaborationSettings;
	account: AccountSettings;
	accessibility: AccessibilitySettings;
	shortcuts: ShortcutSettings;
}

export interface DrawingSettings {
	defaultTool: 'pen' | 'highlighter' | 'eraser';
	defaultBrushSize: number;
	defaultColor: string;
	smoothStrokes: boolean;
}

export interface UISettings {
	darkMode: boolean;
	animateTransitions: boolean;
}

export interface CollaborationSettings {
	showOtherCursors: boolean;
	enableNotifications: boolean;
}

export interface AccountSettings {
	profileColor: string;
}

export interface AccessibilitySettings {
	highContrast: boolean;
	increaseFontSize: boolean;
	enableKeyboardShortcuts: boolean;
}

// Keyboard shortcut types
export interface KeyboardShortcut {
	key: string;
	ctrl?: boolean;
	alt?: boolean;
	shift?: boolean;
	meta?: boolean;
}

export interface ShortcutSettings {
	// Drawing tools
	tools: {
		pen: KeyboardShortcut;
		highlighter: KeyboardShortcut;
		eraser: KeyboardShortcut;
		hand: KeyboardShortcut;
	};
	// Canvas actions
	canvas: {
		undo: KeyboardShortcut;
		redo: KeyboardShortcut;
		clear: KeyboardShortcut;
		zoomIn: KeyboardShortcut;
		zoomOut: KeyboardShortcut;
		resetZoom: KeyboardShortcut;
		save: KeyboardShortcut;
	};
	// UI actions
	ui: {
		toggleSidebar: KeyboardShortcut;
		settings: KeyboardShortcut;
		fullscreen: KeyboardShortcut;
	};
}

export const DEFAULT_SETTINGS: AppSettings = {
	version: '1.0.0',
	drawing: {
		defaultTool: 'pen',
		defaultBrushSize: 2,
		defaultColor: '#000000',
		smoothStrokes: true
	},
	ui: {
		darkMode: false,
		animateTransitions: true
	},
	collaboration: {
		showOtherCursors: true,
		enableNotifications: true
	},
	account: {
		profileColor: '#3498db'
	},
	accessibility: {
		highContrast: false,
		increaseFontSize: false,
		enableKeyboardShortcuts: true
	},
	shortcuts: {
		tools: {
			pen: { key: 'p' },
			highlighter: { key: 'h' },
			eraser: { key: 'e' },
			hand: { key: 'space' }
		},
		canvas: {
			undo: { key: 'z', ctrl: true },
			redo: { key: 'y', ctrl: true },
			clear: { key: 'Delete', alt: true },
			zoomIn: { key: '=', ctrl: true },
			zoomOut: { key: '-', ctrl: true },
			resetZoom: { key: '0', ctrl: true },
			save: { key: 's', ctrl: true }
		},
		ui: {
			toggleSidebar: { key: 'b', ctrl: true },
			settings: { key: ',', ctrl: true },
			fullscreen: { key: 'f', alt: true }
		}
	}
};
