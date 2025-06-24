<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from 'm3-svelte';
	import DrawingCanvas from '$lib/components/DrawingCanvas.svelte';
	import DrawingToolbar from '$lib/components/DrawingToolbar.svelte';
	import { drawingStore } from '$lib/stores/drawing.svelte';
	import { websocketStore } from '$lib/stores/websocket.svelte';
	import { collaborationStore } from '$lib/stores/collaboration.svelte';
	import { apiService } from '$lib/services/api';
	import type { Board } from '$lib/types';

	export let data: { board: Board };
	
	let board = data.board;
	let isLoading = false;

	onMount(() => {
		// Set up the drawing store with the board ID
		drawingStore.setBoardId(board.id);
		
		// Connect websocket handlers to stores
		websocketStore.setDrawingEventHandler((event) => {
			drawingStore.handleDrawingEvent(event);
		});
		
		websocketStore.setCollaboratorJoinedHandler((data) => {
			collaborationStore.addSession(data.sessionId, data.sessionColor);
		});
		
		websocketStore.setCollaboratorLeftHandler((data) => {
			collaborationStore.removeSession(data.sessionId);
		});
		
		websocketStore.setCursorMoveHandler((data) => {
			collaborationStore.updateCursor(data.sessionId, data.cursor);
		});
		
		websocketStore.setSyncEventsHandler((events) => {
			drawingStore.handleSyncEvents(events);
		});
		
		// Connect drawing store to websocket
		drawingStore.setSendFunction((event) => {
			websocketStore.send({
				type: 'drawing_event',
				payload: event,
				boardId: board.id,
				sessionId: drawingStore.sessionId,
				timestamp: Date.now()
			});
		});
		
		// Connect sync function
		drawingStore.setSyncFunction((boardId: string) => {
			websocketStore.requestSync(boardId);
		});
		
		// Connect to websocket and join the board (websocket store will handle queueing)
		websocketStore.joinBoard(board.id, drawingStore.sessionColor);
		
		// Set up collaboration
		collaborationStore.setCurrentSession(drawingStore.sessionId, drawingStore.sessionColor);
		
		return () => {
			websocketStore.disconnect();
		};
	});

	function goBack() {
		goto('/');
	}
</script>

<svelte:head>
	<title>{board.name} - PortalDraw</title>
</svelte:head>

<!-- Fullscreen container with no padding/margin -->
<div class="fixed inset-0 flex flex-col bg-white overflow-hidden">
	<!-- Top toolbar - compact header -->
	<header class="flex items-center justify-between px-4 py-2 border-b bg-white z-20 flex-shrink-0">
		<div class="flex items-center gap-3">
			<Button variant="outlined" onclick={goBack}>
				← Back
			</Button>
			<div class="min-w-0">
				<h1 class="text-lg font-semibold truncate">{board.name}</h1>
				{#if board.description}
					<p class="text-sm text-gray-600 truncate">{board.description}</p>
				{/if}
			</div>
		</div>
		
		<div class="flex items-center gap-3">
			{#if collaborationStore.activeSessionCount > 0}
				<span class="text-sm text-gray-600 whitespace-nowrap">
					{collaborationStore.activeSessionCount} collaborator{collaborationStore.activeSessionCount === 1 ? '' : 's'} online
				</span>
			{/if}
			
			{#if websocketStore.connected}
				<div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Connected"></div>
			{:else if websocketStore.connecting}
				<div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse flex-shrink-0" title="Connecting"></div>
			{:else}
				<div class="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Disconnected"></div>
			{/if}
		</div>
	</header>

	<!-- Drawing toolbar - compact -->
	<div class="border-b bg-white z-20 flex-shrink-0">
		<DrawingToolbar />
	</div>

	<!-- Main canvas area - takes remaining space -->
	<main class="flex-1 relative bg-white overflow-hidden">
		<DrawingCanvas {board} />
		
		<!-- Collaborator cursors -->
		{#each collaborationStore.sessionsWithCursors as session}
			<div 
				class="absolute pointer-events-none z-30 transition-all duration-75"
				style="left: {session.cursor?.x}px; top: {session.cursor?.y}px; transform: translate(-50%, -50%);"
			>
				<div 
					class="w-3 h-3 rounded-full border-2 border-white shadow-sm"
					style="background-color: {session.sessionColor};"
				></div>
				<div 
					class="text-xs text-white px-1 py-0.5 rounded mt-1 whitespace-nowrap shadow-sm"
					style="background-color: {session.sessionColor};"
				>
					Collaborator
				</div>
			</div>
		{/each}
		
		<!-- Error display if websocket has issues -->
		{#if websocketStore.error}
			<div class="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded z-30">
				{websocketStore.error}
			</div>
		{/if}
	</main>
</div> 