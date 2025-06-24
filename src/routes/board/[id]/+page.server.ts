import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

const API_BASE_URL = 'http://localhost:3001';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch(`${API_BASE_URL}/api/boards/${params.id}`);
		
		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Board not found');
			}
			throw error(500, 'Failed to load board');
		}
		
		const board = await response.json();
		
		return {
			board
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to load board');
	}
}; 