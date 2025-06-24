import type { PageServerLoad } from './$types';
import type { Board } from '$lib/types';

const API_BASE_URL = 'http://localhost:3001';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch(`${API_BASE_URL}/api/boards`);
		
		if (!response.ok) {
			return {
				boards: []
			};
		}
		
		const boards: Board[] = await response.json();
		
		return {
			boards
		};
	} catch (error) {
		return {
			boards: []
		};
	}
};
