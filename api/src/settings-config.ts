import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';

// Import types from the frontend (using relative path since it's shared)
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

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
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

	/**
	 * Initialize the settings configuration
	 * Creates config.json if it doesn't exist
	 */
	async initialize(): Promise<void> {
		try {
			// Check if config.json exists
			await fs.access(this.configPath);
			logger.info('Config file found, loading existing settings');
			await this.loadSettings();
		} catch (error) {
			// Config file doesn't exist, create it with defaults
			logger.info('Config file not found, creating with default settings');
			await this.createDefaultConfig();
		}
	}

	/**
	 * Load settings from config.json
	 */
	private async loadSettings(): Promise<void> {
		try {
			const configData = await fs.readFile(this.configPath, 'utf-8');
			const loadedSettings = JSON.parse(configData) as AppSettings;
			
			// Validate and merge with defaults to ensure all properties exist
			this.settings = this.validateAndMergeSettings(loadedSettings);
			
			logger.info('Settings loaded successfully from config.json');
		} catch (error) {
			logger.error('Failed to load settings from config.json:', error);
			logger.info('Using default settings as fallback');
			this.settings = { ...DEFAULT_SETTINGS };
		}
	}

	/**
	 * Create config.json with default settings
	 */
	private async createDefaultConfig(): Promise<void> {
		try {
			const defaultConfig = {
				...DEFAULT_SETTINGS,
				exportDate: new Date().toISOString()
			};
			
			await fs.writeFile(
				this.configPath, 
				JSON.stringify(defaultConfig, null, 2), 
				'utf-8'
			);
			
			this.settings = defaultConfig;
			logger.info(`Default config.json created at: ${this.configPath}`);
		} catch (error) {
			logger.error('Failed to create default config.json:', error);
			throw new Error('Could not create configuration file');
		}
	}

	/**
	 * Validate loaded settings and merge with defaults
	 */
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
			}
		};
	}

	/**
	 * Get current settings
	 */
	getSettings(): AppSettings {
		return { ...this.settings };
	}

	/**
	 * Update settings and save to config.json
	 */
	async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
		try {
			// Merge updates with current settings
			this.settings = {
				...this.settings,
				...updates,
				exportDate: new Date().toISOString(),
				// Deep merge nested objects
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
				}
			};

			// Save to file
			await this.saveSettings();
			
			logger.info('Settings updated successfully');
			return { ...this.settings };
		} catch (error) {
			logger.error('Failed to update settings:', error);
			throw new Error('Could not update settings');
		}
	}

	/**
	 * Reset settings to defaults
	 */
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

	/**
	 * Import settings from provided data
	 */
	async importSettings(importedSettings: any): Promise<AppSettings> {
		try {
			// Validate imported settings
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

	/**
	 * Save current settings to config.json
	 */
	private async saveSettings(): Promise<void> {
		try {
			await fs.writeFile(
				this.configPath, 
				JSON.stringify(this.settings, null, 2), 
				'utf-8'
			);
		} catch (error) {
			logger.error('Failed to save settings to config.json:', error);
			throw error;
		}
	}
} 