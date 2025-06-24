import type { PageServerLoad } from './$types';
import type { Board } from '$lib/types';
import { baseURL } from '$lib/types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch(`${baseURL}/api/boards`);
		
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
