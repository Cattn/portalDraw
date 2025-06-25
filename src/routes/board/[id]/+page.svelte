<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button, TextField, Snackbar } from 'm3-svelte';
	import DrawingCanvas from '$lib/components/DrawingCanvas.svelte';
	import DrawingToolbar from '$lib/components/DrawingToolbar.svelte';
	import KeyboardShortcutsHelp from '$lib/components/KeyboardShortcutsHelp.svelte';
	import { drawingStore } from '$lib/stores/drawing.svelte';
	import { websocketStore } from '$lib/stores/websocket.svelte';
	import { collaborationStore } from '$lib/stores/collaboration.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { currentBoard } from '$lib/store';
	import { apiService } from '$lib/services/api';
	import { fade, fly, slide, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { Board } from '$lib/types';

	let { data }: { data: { board: Board } } = $props();
	
	let board = $state(data.board);
	let isLoading = false;
	let toolbarCollapsed = $state(false);
	let showKeyboardHelp = $state(false);
	
	// Inline editing state
	let editingName = $state(false);
	let editingDescription = $state(false);
	let tempName = $state('');
	let tempDescription = $state('');
	let saving = $state(false);
	
	// Element references for auto-focus and click-outside detection
	let nameFieldElement = $state<HTMLElement>();
	let descriptionFieldElement = $state<HTMLElement>();
	let nameEditContainer = $state<HTMLElement>();
	let descriptionEditContainer = $state<HTMLElement>();
	
	// Create reactive variables that track websocket state
	let connected = $state(false);
	let connecting = $state(false);
	let wsError = $state<string | null>(null);

	// Reactive variables for animation settings
	let animateTransitions = $derived(settingsStore.ui.animateTransitions);
	
	// Reactive variables for collaboration settings
	let showOtherCursors = $derived(settingsStore.collaboration.showOtherCursors);
	let enableNotifications = $derived(settingsStore.collaboration.enableNotifications);
	
	// Snackbar for notifications
	let snackbar: ReturnType<typeof Snackbar> | undefined;
	
	// Update the global currentBoard store when board changes
	$effect(() => {
		currentBoard.set(board);
	});
	
	// Helper function to show snackbar notifications safely
	function showNotification(message: string, isError = false) {
		if (snackbar && enableNotifications) {
			snackbar.show({ 
				message, 
				closable: true 
			});
		}
	}
	
	// Update reactive variables when websocket state changes
	$effect(() => {
		connected = websocketStore.connected;
		connecting = websocketStore.connecting;
		wsError = websocketStore.error;
	});

	// Update temp values when board changes
	$effect(() => {
		tempName = board.name;
		tempDescription = board.description || '';
	});

	// Global click handler for click-outside-to-save functionality
	$effect(() => {
		function handleGlobalClick(event: MouseEvent) {
			// Check if we're editing name and clicked outside the name edit container
			if (editingName && nameEditContainer && !nameEditContainer.contains(event.target as Node)) {
				saveName();
			}
			// Check if we're editing description and clicked outside the description edit container
			if (editingDescription && descriptionEditContainer && !descriptionEditContainer.contains(event.target as Node)) {
				saveDescription();
			}
		}

		if (editingName || editingDescription) {
			document.addEventListener('mousedown', handleGlobalClick);
			return () => document.removeEventListener('mousedown', handleGlobalClick);
		}
	});

	function toggleToolbar() {
		toolbarCollapsed = !toolbarCollapsed;
	}

	async function startEditingName() {
		if (saving) return;
		editingName = true;
		tempName = board.name;
		// Focus the field after DOM update
		setTimeout(() => {
			if (nameFieldElement) {
				const input = nameFieldElement.querySelector('input');
				if (input) {
					input.focus();
					input.select();
				}
			}
		}, 0);
	}

	async function startEditingDescription() {
		if (saving) return;
		editingDescription = true;
		tempDescription = board.description || '';
		// Focus the field after DOM update
		setTimeout(() => {
			if (descriptionFieldElement) {
				const input = descriptionFieldElement.querySelector('input');
				if (input) {
					input.focus();
					input.select();
				}
			}
		}, 0);
	}

	async function saveName() {
		if (saving || !tempName.trim()) {
			cancelNameEdit();
			return;
		}
		
		saving = true;
		try {
			const updatedBoard = await apiService.updateBoard(board.id, { name: tempName.trim() });
			board = updatedBoard;
			editingName = false;
		} catch (error) {
			console.error('Failed to update board name:', error);
			// Reset to original value on error
			tempName = board.name;
		} finally {
			saving = false;
		}
	}

	async function saveDescription() {
		if (saving) return;
		
		saving = true;
		try {
			const updatedBoard = await apiService.updateBoard(board.id, { description: tempDescription.trim() });
			board = updatedBoard;
			editingDescription = false;
		} catch (error) {
			console.error('Failed to update board description:', error);
			// Reset to original value on error
			tempDescription = board.description || '';
		} finally {
			saving = false;
		}
	}

	function cancelNameEdit() {
		tempName = board.name;
		editingName = false;
	}

	function cancelDescriptionEdit() {
		tempDescription = board.description || '';
		editingDescription = false;
	}

	function handleNameKeydown(event: KeyboardEvent) {
		// Stop propagation to prevent global keybinds from interfering
		event.stopPropagation();
		
		if (event.key === 'Enter') {
			event.preventDefault();
			saveName();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelNameEdit();
		}
	}

	function handleDescriptionKeydown(event: KeyboardEvent) {
		// Stop propagation to prevent global keybinds from interfering
		event.stopPropagation();
		
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			saveDescription();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelDescriptionEdit();
		}
	}

	// Prevent global keybinds when text fields are focused
	function handleNameKeyup(event: KeyboardEvent) {
		event.stopPropagation();
	}

	function handleDescriptionKeyup(event: KeyboardEvent) {
		event.stopPropagation();
	}

	onMount(() => {
		// Set up the drawing store with the board ID
		drawingStore.setBoardId(board.id);
		
		// Initialize drawing store with default settings
		const drawingSettings = settingsStore.drawing;
		drawingStore.setTool({
			type: drawingSettings.defaultTool === 'highlighter' ? 'highlighter' : 
				  drawingSettings.defaultTool === 'eraser' ? 'eraser' : 'pen',
			size: drawingSettings.defaultBrushSize,
			opacity: drawingSettings.defaultTool === 'highlighter' ? 0.5 : 1
		});
		drawingStore.setColor(drawingSettings.defaultColor);
		
		// Connect websocket handlers to stores
		websocketStore.setDrawingEventHandler((event) => {
			drawingStore.handleDrawingEvent(event);
		});
		
		websocketStore.setCollaboratorJoinedHandler((data) => {
			collaborationStore.addSession(data.sessionId, data.sessionColor);
			showNotification('A collaborator joined the board');
		});
		
		websocketStore.setCollaboratorLeftHandler((data) => {
			collaborationStore.removeSession(data.sessionId);
			showNotification('A collaborator left the board');
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

		// Listen for keyboard save shortcut
		const handleKeyboardSave = async () => {
			// Auto-save the current board state
			try {
				showNotification('Board saved automatically');
			} catch (error) {
				console.error('Failed to save board:', error);
				showNotification('Failed to save board', true);
			}
		};

		window.addEventListener('keyboard-save', handleKeyboardSave);

		// Listen for help keyboard shortcuts
		const handleHelpKeydown = (event: KeyboardEvent) => {
			if (event.key === '?' || event.key === 'F1') {
				event.preventDefault();
				showKeyboardHelp = true;
			}
		};

		document.addEventListener('keydown', handleHelpKeydown);
		
		return () => {
			websocketStore.disconnect();
			window.removeEventListener('keyboard-save', handleKeyboardSave);
			document.removeEventListener('keydown', handleHelpKeydown);
			// Clear the current board when leaving the page
			currentBoard.set(null);
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
<div class="fixed inset-0 pr-20 flex flex-col bg-surface-container-high overflow-hidden">
	<!-- Top toolbar - compact header -->
	<header 
		class="flex items-center justify-between px-4 py-2 border-b border-surface-container-low bg-surface-container-high z-20 flex-shrink-0"
		{...animateTransitions ? { in: slide, params: { duration: 300, easing: quintOut } } : {}}
	>
		<div class="flex items-center gap-3">
			<Button variant="outlined" onclick={goBack}>
				← Back
			</Button>
			<div class="min-w-0 flex-1">
				<!-- Editable board name -->
				{#if editingName}
					<div bind:this={nameEditContainer} class="flex items-center gap-2">
						<div bind:this={nameFieldElement} class="flex-1">
							<TextField
								label="Board name"
								bind:value={tempName}
								placeholder="Enter board name"
								disabled={saving}
								onkeydown={handleNameKeydown}
								onkeyup={handleNameKeyup}
							/>
						</div>
					</div>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				{:else}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<h1 
						class="text-lg font-bold truncate cursor-pointer hover:bg-surface-container-low rounded px-1 py-0.5 transition-colors" 
						onclick={startEditingName}
						title="Click to edit board name"
					>
						{board.name}
					</h1>
				{/if}
				
				<!-- Editable board description -->
				{#if editingDescription}
					<div bind:this={descriptionEditContainer} class="flex items-center gap-2 mt-1">
						<div bind:this={descriptionFieldElement} class="flex-1">
							<TextField
								label="Board description"
								bind:value={tempDescription}
								placeholder="Enter board description (optional)"
								disabled={saving}
								onkeydown={handleDescriptionKeydown}
								onkeyup={handleDescriptionKeyup}
							/>
						</div>
					</div>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				{:else if board.description}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p 
						class="text-sm text-on-surface truncate cursor-pointer hover:bg-surface-container-low rounded px-1 py-0.5 transition-colors" 
						onclick={startEditingDescription}
						title="Click to edit board description"
					>
						{board.description}
					</p>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				{:else}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p 
						class="text-sm text-on-surface-variant truncate cursor-pointer hover:bg-surface-container-low rounded px-1 py-0.5 transition-colors italic" 
						onclick={startEditingDescription}
						title="Click to add board description"
					>
						Add description...
					</p>
				{/if}
			</div>
		</div>
		
		<div class="flex items-center gap-3">
			{#if toolbarCollapsed}
				<Button variant="tonal" onclick={toggleToolbar} square title="Expand toolbar" aria-label="Expand toolbar">
					↓
				</Button>
			{/if}
			
			<Button 
				variant="text" 
				onclick={() => showKeyboardHelp = true} 
				square 
				title="Keyboard shortcuts (? or F1)" 
				aria-label="Show keyboard shortcuts"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
					<path fill="currentColor" d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m-1 15h2v-6h-2z"/>
				</svg>
			</Button>
			
			{#if collaborationStore.activeSessionCount > 0}
				<span class="text-sm text-on-surface whitespace-nowrap">
					{collaborationStore.activeSessionCount} collaborator{collaborationStore.activeSessionCount === 1 ? '' : 's'} online
				</span>
			{/if}
			
			{#if connected}
				<div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Connected"></div>
			{:else if connecting}
				<div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse flex-shrink-0" title="Connecting"></div>
			{:else}
				<div class="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Disconnected"></div>
			{/if}
		</div>
	</header>

	<!-- Drawing toolbar - compact -->
	{#if !toolbarCollapsed}
		<div 
			class="border-b border-surface-container-low bg-surface-container-high z-20 flex-shrink-0"
			{...animateTransitions ? { 
				in: slide, 
				params: { duration: 300, easing: quintOut },
				out: slide,
				outparams: { duration: 200, easing: quintOut }
			} : {}}
		>
			<DrawingToolbar {toolbarCollapsed} {toggleToolbar} />
		</div>
	{/if}

	<!-- Main canvas area - takes remaining space -->
	<main class="flex-1 relative bg-surface-container-high overflow-hidden">
		<DrawingCanvas {board} />
		
		<!-- Collaborator cursors -->
		{#if showOtherCursors}
			{#each collaborationStore.sessionsWithCursors as session}
				<div 
					class="absolute pointer-events-none z-30 transition-all duration-75"
					style="left: {session.cursor?.x}px; top: {session.cursor?.y}px; transform: translate(-50%, -50%);"
				>
					<div 
						class="w-3 h-3 rounded-full border-2 border-surface-container-low shadow-sm"
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
		{/if}
		
		<!-- Error display if websocket has issues -->
		{#if wsError}
			<div class="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded z-30">
				{wsError}
			</div>
		{/if}
	</main>
</div>

<!-- Snackbar for notifications -->
<Snackbar bind:this={snackbar} />

<!-- Keyboard shortcuts help modal -->
<KeyboardShortcutsHelp bind:visible={showKeyboardHelp} /> 