import type { Collaborator, Point } from '$lib/types';

class CollaborationStore {
	activeSessions = $state<Collaborator[]>([]);

	currentSessionId = $state<string | null>(null);
	currentSessionColor = $state('#3498db');

	addSession(sessionId: string, color: string) {
		const existingIndex = this.activeSessions.findIndex((s) => s.id === sessionId);

		if (existingIndex === -1) {
			this.activeSessions.push({
				id: sessionId,
				sessionColor: color,
				cursor: undefined,
				isOnline: true
			});
		} else {
			this.activeSessions[existingIndex].isOnline = true;
		}
	}

	removeSession(sessionId: string) {
		const index = this.activeSessions.findIndex((s) => s.id === sessionId);
		if (index !== -1) {
			this.activeSessions.splice(index, 1);
		}
	}

	updateCursor(sessionId: string, cursor: Point) {
		const session = this.activeSessions.find((s) => s.id === sessionId);
		if (session) {
			session.cursor = cursor;
		}
	}

	setCurrentSession(sessionId: string, color: string) {
		this.currentSessionId = sessionId;
		this.currentSessionColor = color;
	}

	get activeSessionCount() {
		return this.activeSessions.filter((s) => s.id !== this.currentSessionId).length;
	}

	get sessionsWithCursors() {
		return this.activeSessions.filter(
			(s) => s.id !== this.currentSessionId && s.cursor && s.isOnline
		);
	}
}

export const collaborationStore = new CollaborationStore();
