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
	}
};