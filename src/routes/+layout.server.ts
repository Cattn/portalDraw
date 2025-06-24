import { DEFAULT_SETTINGS } from '$lib/types';
import type { LayoutServerLoad } from './$types';
import { getBaseURL } from '$lib/types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	try {
		// Load settings from the API server using server-side fetch
		const baseURL = getBaseURL();
		const apiUrl = `${baseURL}/api/settings`;
		console.log('SSR attempting to connect to API at:', apiUrl);
		
		const response = await fetch(apiUrl);
		
		if (!response.ok) {
			console.error('API response not ok:', response.status, response.statusText);
			throw new Error(`HTTP ${response.status}`);
		}
		
		const settings = await response.json();
		
		return {
			settings
		};
	} catch (error) {
		console.error('Failed to load settings in layout:', error);
		
		// Return default settings as fallback
		return {
			settings: DEFAULT_SETTINGS
		};
	}
};
