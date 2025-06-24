import { DEFAULT_SETTINGS } from '$lib/types';
import type { LayoutServerLoad } from './$types';
import { baseURL } from '$lib/types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	try {
		// Load settings from the API server using server-side fetch
		const response = await fetch(`${baseURL}/api/settings`);
		
		if (!response.ok) {
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
