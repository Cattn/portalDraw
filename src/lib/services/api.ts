import { browser } from '$app/environment';
import type { Board, DrawingEvent, BoardSession, AppSettings } from '$lib/types';
import { getBaseURL } from '$lib/types';

// Extended API response interface for settings
interface SettingsResponse extends AppSettings {
	_globalSettingsDisabled?: boolean;
}

class ApiService {
	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const baseURL = getBaseURL();
		const url = `${baseURL}/api${endpoint}`;
		
		const defaultOptions: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
			},
		};
		
		const response = await fetch(url, { ...defaultOptions, ...options });
		
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Network error' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		
		return response.json();
	}

	// Board API methods
	async getBoards(): Promise<Board[]> {
		return this.request<Board[]>('/boards');
	}

	async createBoard(data: { name: string; description?: string; is_public?: boolean }): Promise<Board> {
		return this.request<Board>('/boards', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async getBoardById(id: string): Promise<Board> {
		return this.request<Board>(`/boards/${id}`);
	}

	async updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
		return this.request<Board>(`/boards/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	async deleteBoard(id: string): Promise<void> {
		const baseURL = getBaseURL();
		const url = `${baseURL}/api/boards/${id}`;
		
		const response = await fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		
		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Network error' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}
		
		// Don't try to parse JSON for 204 No Content responses
		return;
	}

	async getBoardEvents(boardId: string, fromSequence?: number): Promise<DrawingEvent[]> {
		const query = fromSequence ? `?fromSequence=${fromSequence}` : '';
		return this.request<DrawingEvent[]>(`/boards/${boardId}/events${query}`);
	}

	async getBoardSessions(boardId: string): Promise<BoardSession[]> {
		return this.request<BoardSession[]>(`/boards/${boardId}/sessions`);
	}

	// Settings API methods
	async getSettings(): Promise<{ settings: AppSettings; globalSettingsDisabled: boolean }> {
		const response = await this.request<SettingsResponse>('/settings');
		const { _globalSettingsDisabled, ...settings } = response;
		return {
			settings: settings as AppSettings,
			globalSettingsDisabled: _globalSettingsDisabled || false
		};
	}

	async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
		const response = await this.request<SettingsResponse>('/settings', {
			method: 'PUT',
			body: JSON.stringify(settings),
		});
		const { _globalSettingsDisabled, ...cleanSettings } = response;
		return cleanSettings as AppSettings;
	}

	async resetSettings(): Promise<AppSettings> {
		const response = await this.request<SettingsResponse>('/settings/reset', {
			method: 'POST',
		});
		const { _globalSettingsDisabled, ...cleanSettings } = response;
		return cleanSettings as AppSettings;
	}

	async importSettings(settings: AppSettings): Promise<AppSettings> {
		const response = await this.request<SettingsResponse>('/settings/import', {
			method: 'POST',
			body: JSON.stringify(settings),
		});
		const { _globalSettingsDisabled, ...cleanSettings } = response;
		return cleanSettings as AppSettings;
	}

	// Health check
	async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
		const baseURL = getBaseURL();
		const url = `${baseURL}/health`;
		const response = await fetch(url);
		return response.json();
	}
}

export const apiService = new ApiService(); 