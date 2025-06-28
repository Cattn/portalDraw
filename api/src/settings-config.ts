import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';

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

export interface KeyboardShortcut {
	key: string;
	ctrl?: boolean;
	alt?: boolean;
	shift?: boolean;
	meta?: boolean;
}

export interface ShortcutSettings {
	tools: {
		pen: KeyboardShortcut;
		highlighter: KeyboardShortcut;
		eraser: KeyboardShortcut;
		hand: KeyboardShortcut;
	};
	canvas: {
		undo: KeyboardShortcut;
		redo: KeyboardShortcut;
		clear: KeyboardShortcut;
		zoomIn: KeyboardShortcut;
		zoomOut: KeyboardShortcut;
		resetZoom: KeyboardShortcut;
		save: KeyboardShortcut;
	};
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

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'api.log' })
	]
});

export class SettingsConfig {
	private configPath: string;
	private settings: AppSettings;

	constructor(configPath: string = path.join(process.cwd(), 'config.json')) {
		this.configPath = configPath;
		this.settings = { ...DEFAULT_SETTINGS };
	}

	async initialize(): Promise<void> {
		try {
			await fs.access(this.configPath);
			logger.info('Config file found, loading existing settings');
			await this.loadSettings();
		} catch (error) {
			logger.info('Config file not found, creating with default settings');
			await this.createDefaultConfig();
		}
	}

	private async loadSettings(): Promise<void> {
		try {
			const configData = await fs.readFile(this.configPath, 'utf-8');
			const loadedSettings = JSON.parse(configData) as AppSettings;

			this.settings = this.validateAndMergeSettings(loadedSettings);

			logger.info('Settings loaded successfully from config.json');
		} catch (error) {
			logger.error('Failed to load settings from config.json:', error);
			logger.info('Using default settings as fallback');
			this.settings = { ...DEFAULT_SETTINGS };
		}
	}

	private async createDefaultConfig(): Promise<void> {
		try {
			const defaultConfig = {
				...DEFAULT_SETTINGS,
				exportDate: new Date().toISOString()
			};

			await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');

			this.settings = defaultConfig;
			logger.info(`Default config.json created at: ${this.configPath}`);
		} catch (error) {
			logger.error('Failed to create default config.json:', error);
			throw new Error('Could not create configuration file');
		}
	}

	private validateAndMergeSettings(loadedSettings: any): AppSettings {
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

	getSettings(): AppSettings {
		return { ...this.settings };
	}

	async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
		try {
			this.settings = {
				...this.settings,
				...updates,
				exportDate: new Date().toISOString(),
				drawing: {
					...this.settings.drawing,
					...(updates.drawing || {})
				},
				ui: {
					...this.settings.ui,
					...(updates.ui || {})
				},
				collaboration: {
					...this.settings.collaboration,
					...(updates.collaboration || {})
				},
				account: {
					...this.settings.account,
					...(updates.account || {})
				},
				accessibility: {
					...this.settings.accessibility,
					...(updates.accessibility || {})
				},
				shortcuts: {
					...this.settings.shortcuts,
					...(updates.shortcuts || {}),
					tools: {
						...this.settings.shortcuts.tools,
						...(updates.shortcuts?.tools || {})
					},
					canvas: {
						...this.settings.shortcuts.canvas,
						...(updates.shortcuts?.canvas || {})
					},
					ui: {
						...this.settings.shortcuts.ui,
						...(updates.shortcuts?.ui || {})
					}
				}
			};

			await this.saveSettings();

			logger.info('Settings updated successfully');
			return { ...this.settings };
		} catch (error) {
			logger.error('Failed to update settings:', error);
			throw new Error('Could not update settings');
		}
	}

	async resetToDefaults(): Promise<AppSettings> {
		try {
			this.settings = {
				...DEFAULT_SETTINGS,
				exportDate: new Date().toISOString()
			};

			await this.saveSettings();

			logger.info('Settings reset to defaults');
			return { ...this.settings };
		} catch (error) {
			logger.error('Failed to reset settings:', error);
			throw new Error('Could not reset settings');
		}
	}

	async importSettings(importedSettings: any): Promise<AppSettings> {
		try {
			const validatedSettings = this.validateAndMergeSettings(importedSettings);

			this.settings = {
				...validatedSettings,
				exportDate: new Date().toISOString()
			};

			await this.saveSettings();

			logger.info('Settings imported successfully');
			return { ...this.settings };
		} catch (error) {
			logger.error('Failed to import settings:', error);
			throw new Error('Could not import settings');
		}
	}

	private async saveSettings(): Promise<void> {
		try {
			await fs.writeFile(this.configPath, JSON.stringify(this.settings, null, 2), 'utf-8');
		} catch (error) {
			logger.error('Failed to save settings to config.json:', error);
			throw error;
		}
	}
}
