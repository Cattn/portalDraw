import { apiService } from '$lib/services/api';
import { DEFAULT_SETTINGS, type AppSettings } from '$lib/types';
import { browser } from '$app/environment';

const LOCAL_SETTINGS_KEY = 'portaldraw_local_settings';

class SettingsStore {
	#settings = $state<AppSettings>({ ...DEFAULT_SETTINGS });
	#isLoading = $state(false);
	#error = $state<string | null>(null);
	#globalSettingsDisabled = $state(false);
	#isLocalMode = $state(false);

	get settings(): AppSettings {
		return this.#settings;
	}

	get isLoading(): boolean {
		return this.#isLoading;
	}

	get error(): string | null {
		return this.#error;
	}

	get globalSettingsDisabled(): boolean {
		return this.#globalSettingsDisabled;
	}

	get isLocalMode(): boolean {
		return this.#isLocalMode;
	}

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

	get shortcuts() {
		return this.#settings.shortcuts;
	}

	initializeSettings(settings: AppSettings): void {
		this.#settings = settings;

		if (browser && this.#globalSettingsDisabled) {
			this.#loadLocalSettings();
		}
	}

	async loadSettings(): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			const result = await apiService.getSettings();
			this.#settings = result.settings;
			this.#globalSettingsDisabled = result.globalSettingsDisabled;
			this.#isLocalMode = this.#globalSettingsDisabled;

			if (this.#globalSettingsDisabled && browser) {
				this.#loadLocalSettings();
			}
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to load settings';
			console.error('Failed to load settings:', error);
		} finally {
			this.#isLoading = false;
		}
	}

	async updateSettings(updates: Partial<AppSettings>): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			if (this.#globalSettingsDisabled) {
				this.#updateLocalSettings(updates);
			} else {
				const updatedSettings = await apiService.updateSettings(updates);
				this.#settings = updatedSettings;
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes('Global settings')) {
				console.log('Global settings disabled, switching to local mode');
				this.#globalSettingsDisabled = true;
				this.#isLocalMode = true;
				this.#updateLocalSettings(updates);
			} else {
				this.#error = error instanceof Error ? error.message : 'Failed to update settings';
				console.error('Failed to update settings:', error);
				throw error;
			}
		} finally {
			this.#isLoading = false;
		}
	}

	async resetToDefaults(): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			if (this.#globalSettingsDisabled) {
				this.#settings = { ...DEFAULT_SETTINGS };
				this.#saveLocalSettings();
			} else {
				const defaultSettings = await apiService.resetSettings();
				this.#settings = defaultSettings;
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes('Global settings')) {
				console.log('Global settings disabled, resetting locally');
				this.#globalSettingsDisabled = true;
				this.#isLocalMode = true;
				this.#settings = { ...DEFAULT_SETTINGS };
				this.#saveLocalSettings();
			} else {
				this.#error = error instanceof Error ? error.message : 'Failed to reset settings';
				console.error('Failed to reset settings:', error);
				throw error;
			}
		} finally {
			this.#isLoading = false;
		}
	}

	async importSettings(importData: AppSettings): Promise<void> {
		this.#isLoading = true;
		this.#error = null;

		try {
			if (this.#globalSettingsDisabled) {
				this.#settings = { ...importData };
				this.#saveLocalSettings();
			} else {
				const importedSettings = await apiService.importSettings(importData);
				this.#settings = importedSettings;
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes('Global settings')) {
				console.log('Global settings disabled, importing locally');
				this.#globalSettingsDisabled = true;
				this.#isLocalMode = true;
				this.#settings = { ...importData };
				this.#saveLocalSettings();
			} else {
				this.#error = error instanceof Error ? error.message : 'Failed to import settings';
				console.error('Failed to import settings:', error);
				throw error;
			}
		} finally {
			this.#isLoading = false;
		}
	}

	exportSettings(): void {
		try {
			const settings = { ...this.#settings, exportDate: new Date().toISOString() };
			const settingsJson = JSON.stringify(settings, null, 2);

			const blob = new Blob([settingsJson], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = this.#isLocalMode ? 'portal_draw_local.json' : 'portal_draw.json';
			document.body.appendChild(a);
			a.click();

			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to export settings:', error);
			throw new Error('Failed to export settings');
		}
	}

	async updateSection<K extends keyof AppSettings>(
		section: K,
		updates: Partial<AppSettings[K]>
	): Promise<void> {
		const sectionUpdates = {
			[section]: {
				...(this.#settings[section] as object),
				...updates
			}
		} as Partial<AppSettings>;

		await this.updateSettings(sectionUpdates);
	}

	#loadLocalSettings(): void {
		if (!browser) return;

		try {
			const localSettings = localStorage.getItem(LOCAL_SETTINGS_KEY);
			if (localSettings) {
				const parsedSettings = JSON.parse(localSettings);
				this.#settings = this.#validateAndMergeSettings(parsedSettings);
				console.log('Loaded local settings from localStorage');
			}
		} catch (error) {
			console.error('Failed to load local settings:', error);
		}
	}

	#saveLocalSettings(): void {
		if (!browser) return;

		try {
			localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(this.#settings));
		} catch (error) {
			console.error('Failed to save local settings:', error);
		}
	}

	#updateLocalSettings(updates: Partial<AppSettings>): void {
		this.#settings = {
			...this.#settings,
			...updates,
			drawing: {
				...this.#settings.drawing,
				...(updates.drawing || {})
			},
			ui: {
				...this.#settings.ui,
				...(updates.ui || {})
			},
			collaboration: {
				...this.#settings.collaboration,
				...(updates.collaboration || {})
			},
			account: {
				...this.#settings.account,
				...(updates.account || {})
			},
			accessibility: {
				...this.#settings.accessibility,
				...(updates.accessibility || {})
			},
			shortcuts: {
				...this.#settings.shortcuts,
				...(updates.shortcuts || {}),
				tools: {
					...this.#settings.shortcuts.tools,
					...(updates.shortcuts?.tools || {})
				},
				canvas: {
					...this.#settings.shortcuts.canvas,
					...(updates.shortcuts?.canvas || {})
				},
				ui: {
					...this.#settings.shortcuts.ui,
					...(updates.shortcuts?.ui || {})
				}
			}
		};

		this.#saveLocalSettings();
	}

	#validateAndMergeSettings(loadedSettings: any): AppSettings {
		return {
			version: loadedSettings.version || DEFAULT_SETTINGS.version,
			exportDate: loadedSettings.exportDate,
			drawing: {
				...DEFAULT_SETTINGS.drawing,
				...(loadedSettings.drawing || {})
			},
			ui: {
				...DEFAULT_SETTINGS.ui,
				...(loadedSettings.ui || {})
			},
			collaboration: {
				...DEFAULT_SETTINGS.collaboration,
				...(loadedSettings.collaboration || {})
			},
			account: {
				...DEFAULT_SETTINGS.account,
				...(loadedSettings.account || {})
			},
			accessibility: {
				...DEFAULT_SETTINGS.accessibility,
				...(loadedSettings.accessibility || {})
			},
			shortcuts: {
				...DEFAULT_SETTINGS.shortcuts,
				...(loadedSettings.shortcuts || {}),
				tools: {
					...DEFAULT_SETTINGS.shortcuts.tools,
					...(loadedSettings.shortcuts?.tools || {})
				},
				canvas: {
					...DEFAULT_SETTINGS.shortcuts.canvas,
					...(loadedSettings.shortcuts?.canvas || {})
				},
				ui: {
					...DEFAULT_SETTINGS.shortcuts.ui,
					...(loadedSettings.shortcuts?.ui || {})
				}
			}
		};
	}
}

export const settingsStore = new SettingsStore();
