import { Router, Request, Response } from 'express';
import { SettingsConfig } from '../settings-config';
import { config } from '../config';

export function createSettingsRouter(settingsConfig: SettingsConfig): Router {
	const router = Router();

	router.get('/', async (req: Request, res: Response) => {
		try {
			const settings = settingsConfig.getSettings();
			res.json({
				...settings,
				_globalSettingsDisabled: config.settings.disableGlobalSettings
			});
		} catch (error) {
			res.status(500).json({ error: 'Failed to get settings' });
		}
	});

	router.put('/', async (req: Request, res: Response) => {
		if (config.settings.disableGlobalSettings) {
			res.status(403).json({
				error: 'Global settings updates are disabled by configuration',
				code: 'GLOBAL_SETTINGS_DISABLED'
			});
			return;
		}

		try {
			const updates = req.body;
			const updatedSettings = await settingsConfig.updateSettings(updates);
			res.json({
				...updatedSettings,
				_globalSettingsDisabled: config.settings.disableGlobalSettings
			});
		} catch (error) {
			res.status(500).json({ error: 'Failed to update settings' });
		}
	});

	router.post('/reset', async (req: Request, res: Response) => {
		if (config.settings.disableGlobalSettings) {
			res.status(403).json({
				error: 'Global settings reset is disabled by configuration',
				code: 'GLOBAL_SETTINGS_DISABLED'
			});
			return;
		}

		try {
			const defaultSettings = await settingsConfig.resetToDefaults();
			res.json({
				...defaultSettings,
				_globalSettingsDisabled: config.settings.disableGlobalSettings
			});
		} catch (error) {
			res.status(500).json({ error: 'Failed to reset settings' });
		}
	});

	router.post('/import', async (req: Request, res: Response) => {
		if (config.settings.disableGlobalSettings) {
			res.status(403).json({
				error: 'Global settings import is disabled by configuration',
				code: 'GLOBAL_SETTINGS_DISABLED'
			});
			return;
		}

		try {
			const importedData = req.body;
			const importedSettings = await settingsConfig.importSettings(importedData);
			res.json({
				...importedSettings,
				_globalSettingsDisabled: config.settings.disableGlobalSettings
			});
		} catch (error) {
			res.status(400).json({ error: 'Failed to import settings' });
		}
	});

	return router;
}
