import { DEFAULT_SETTINGS } from '$lib/types';
import type { LayoutServerLoad } from './$types';
import { getBaseURL } from '$lib/types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	try {
		const baseURL = getBaseURL();
		const apiUrl = `${baseURL}/api/settings`;

		const response = await fetch(apiUrl);

		if (!response.ok) {
			console.error('API response not ok:', response.status, response.statusText);
			throw new Error(`HTTP ${response.status}`);
		}

		const settingsResponse = await response.json();
		const { _globalSettingsDisabled, ...settings } = settingsResponse;

		return {
			settings,
			globalSettingsDisabled: _globalSettingsDisabled || false
		};
	} catch (error) {
		console.error('Failed to load settings in layout:', error);

		return {
			settings: DEFAULT_SETTINGS,
			globalSettingsDisabled: false
		};
	}
};
