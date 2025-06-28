import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { currentBoard } from '$lib/store';
import { baseURL } from '$lib/types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch(`${baseURL}/api/boards/${params.id}`);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Board not found');
			}
			throw error(500, 'Failed to load board');
		}

		const board = await response.json();
		currentBoard.set(board);
		return {
			board
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load board');
	}
};
