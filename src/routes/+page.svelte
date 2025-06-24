<script lang="ts">
	import { Button } from 'm3-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import type { Board } from '$lib/types';
	import { apiService } from '$lib/services/api';

	export let data: App.PageData;
	
	let boards: Board[] = data.boards || [];
	let isCreating = false;

	async function createBoard() {
		if (isCreating) return;
		
		isCreating = true;
		try {
			const newBoard = await apiService.createBoard({
				name: `Board ${new Date().toLocaleString()}`,
				description: 'A new collaborative drawing board',
				is_public: true
			});
			
			boards = [newBoard, ...boards];
		} catch (error) {
			alert('Failed to create board. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	async function openBoard(boardId: string) {
		// Navigate to the board page
		goto(`/board/${boardId}`);
	}
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Collaborative Drawing Boards</h1>
	
	<div class="mb-4">
		<Button 
			variant="filled" 
			onclick={createBoard}
			disabled={isCreating}
		>
			{isCreating ? 'Creating...' : 'Create New Board'}
		</Button>
	</div>
	
	{#if boards.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each boards as board}
				<div class="border rounded-lg p-4">
					<h3 class="font-semibold">{board.name}</h3>
					{#if board.description}
						<p class="text-gray-600 text-sm">{board.description}</p>
					{/if}
					<div class="mt-2 text-xs text-gray-500">
						Created: {new Date(board.created_at).toLocaleDateString()}
					</div>
					<div class="mt-2">
						<Button 
							variant="outlined"
							onclick={() => openBoard(board.id)}
						>
							Open Board
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-500">No boards yet. Create your first collaborative drawing board!</p>
	{/if}
</div>
