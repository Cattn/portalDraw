import { apiService } from '$lib/services/api';
import { DEFAULT_SETTINGS, type AppSettings } from '$lib/types';

class SettingsStore {
	#settings = $state<AppSettings>({ ...DEFAULT_SETTINGS });
	#isLoading = $state(false);
	#error = $state<string | null>(null);

	get settings(): AppSettings {
		return this.#settings;
	}

	get isLoading(): boolean {
		return this.#isLoading;
	}

	get error(): string | null {
		return this.#error;
	}

	// Individual setting getters for convenience
	get drawing() {
		return this.#settings.drawing;
	}

	get ui() {
		return this.#settings.ui;
	}

	get collaboration() {
		return this.#settings.collaboration;
	}

	get account() {
		return this.#settings.account;
	}

	get accessibility() {
		return this.#settings.accessibility;
	}

	/**
	 * Initialize settings with server-loaded data
	 */
	initializeSettings(settings: AppSettings): void {
		this.#settings = settings;
	}

	/**
	 * Load settings from the API
	 */
	async loadSettings(): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			const settings = await apiService.getSettings();
			this.#settings = settings;
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to load settings';
			console.error('Failed to load settings:', error);
			// Keep default settings on error
		} finally {
			this.#isLoading = false;
		}
	}

	/**
	 * Update settings on the server
	 */
	async updateSettings(updates: Partial<AppSettings>): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			const updatedSettings = await apiService.updateSettings(updates);
			this.#settings = updatedSettings;
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to update settings';
			console.error('Failed to update settings:', error);
			throw error;
		} finally {
			this.#isLoading = false;
		}
	}

	/**
	 * Reset settings to defaults
	 */
	async resetToDefaults(): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			const defaultSettings = await apiService.resetSettings();
			this.#settings = defaultSettings;
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to reset settings';
			console.error('Failed to reset settings:', error);
			throw error;
		} finally {
			this.#isLoading = false;
		}
	}

	/**
	 * Import settings from data
	 */
	async importSettings(importData: AppSettings): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			const importedSettings = await apiService.importSettings(importData);
			this.#settings = importedSettings;
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to import settings';
			console.error('Failed to import settings:', error);
			throw error;
		} finally {
			this.#isLoading = false;
		}
	}

	/**
	 * Export current settings
	 */
	exportSettings(): void {
		try {
			const settings = { ...this.#settings, exportDate: new Date().toISOString() };
			const settingsJson = JSON.stringify(settings, null, 2);
			
			// Create blob and download link
			const blob = new Blob([settingsJson], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			
			// Create temporary download link
			const a = document.createElement('a');
			a.href = url;
			a.download = 'portal_draw.json';
			document.body.appendChild(a);
			a.click();
			
			// Cleanup
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to export settings:', error);
			throw new Error('Failed to export settings');
		}
	}

	/**
	 * Update a specific section of settings
	 */
	async updateSection<K extends keyof AppSettings>(
		section: K,
		updates: Partial<AppSettings[K]>
	): Promise<void> {
		const sectionUpdates = {
			[section]: {
				...this.#settings[section],
				...updates
			}
		} as Partial<AppSettings>;

		await this.updateSettings(sectionUpdates);
	}
}

export const settingsStore = new SettingsStore(); 