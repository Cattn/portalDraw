<script lang="ts">
	import { Button } from 'm3-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';

	import type { Board } from '$lib/types';
	import { apiService } from '$lib/services/api';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { transitions, cssTransitions } from '$lib/utils';

	let { data }: { data: App.PageData } = $props();

	let boards = $state<Board[]>(data.boards || []);
	let isCreating = $state(false);
	let isDeleting = $state(false);

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
		goto(`/board/${boardId}`);
	}

	async function confirmDelete(board: Board) {
		const confirmed = confirm(
			`Are you sure you want to delete "${board.name}"? This action cannot be undone and will remove all drawing data associated with this board.`
		);

		if (!confirmed) return;

		if (isDeleting) return;

		isDeleting = true;
		try {
			await apiService.deleteBoard(board.id);
			boards = boards.filter((b) => b.id !== board.id);
		} catch (error) {
			alert('Failed to delete board. Please try again.');
		} finally {
			isDeleting = false;
		}
	}
</script>

<div class="p-4">
	<h1 class="mb-4 text-2xl font-bold" {...transitions.fade({ duration: 500, delay: 100 })}>
		Collaborative Drawing Boards
	</h1>

	<div class="mb-4" {...transitions.fly({ y: 20, duration: 400, delay: 200 })}>
		<Button variant="filled" onclick={createBoard} disabled={isCreating}>
			{isCreating ? 'Creating...' : 'Create New Board'}
		</Button>
	</div>

	{#if boards.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each boards as board, index (board.id)}
				<div
					class="rounded-lg border p-4 {cssTransitions.card}"
					{...transitions.staggeredFly(index, { baseDelay: 300, stagger: 100, y: 30 })}
					{...transitions.flip()}
				>
					<h3 class="font-semibold">{board.name}</h3>
					{#if board.description}
						<p class="text-sm text-gray-600">{board.description}</p>
					{/if}
					<div class="mt-2 text-xs text-gray-500">
						Created: {new Date(board.created_at).toLocaleDateString()}
					</div>
					<div class="mt-3 flex gap-2">
						<Button variant="filled" onclick={() => openBoard(board.id)}>Open Board</Button>
						<Button variant="tonal" onclick={() => confirmDelete(board)} disabled={isDeleting}>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-500" {...transitions.fade({ duration: 400, delay: 300 })}>
			No boards yet. Create your first collaborative drawing board!
		</p>
	{/if}
</div>
