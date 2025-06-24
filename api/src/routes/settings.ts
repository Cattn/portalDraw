import { Router, Request, Response } from 'express';
import { SettingsConfig } from '../settings-config';

export function createSettingsRouter(settingsConfig: SettingsConfig): Router {
	const router = Router();

	// GET /api/settings - Get current settings
	router.get('/', async (req: Request, res: Response) => {
		try {
			const settings = settingsConfig.getSettings();
			res.json(settings);
		} catch (error) {
			res.status(500).json({ error: 'Failed to get settings' });
		}
	});

	// PUT /api/settings - Update settings
	router.put('/', async (req: Request, res: Response) => {
		try {
			const updates = req.body;
			const updatedSettings = await settingsConfig.updateSettings(updates);
			res.json(updatedSettings);
		} catch (error) {
			res.status(500).json({ error: 'Failed to update settings' });
		}
	});

	// POST /api/settings/reset - Reset settings to defaults
	router.post('/reset', async (req: Request, res: Response) => {
		try {
			const defaultSettings = await settingsConfig.resetToDefaults();
			res.json(defaultSettings);
		} catch (error) {
			res.status(500).json({ error: 'Failed to reset settings' });
		}
	});

	// POST /api/settings/import - Import settings
	router.post('/import', async (req: Request, res: Response) => {
		try {
			const importedData = req.body;
			const importedSettings = await settingsConfig.importSettings(importedData);
			res.json(importedSettings);
		} catch (error) {
			res.status(400).json({ error: 'Failed to import settings' });
		}
	});

	return router;
} 