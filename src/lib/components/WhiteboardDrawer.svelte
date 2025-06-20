<script lang="ts">
	import { Button } from 'm3-svelte';
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	export let whiteboards: Whiteboard[] = [];
	export let currentWhiteboardId: string = '';

	interface Whiteboard {
		id: string;
		name: string;
		thumbnail?: string;
		lastModified: Date;
	}

	const dispatch = createEventDispatcher<{
		createNew: void;
		selectBoard: { id: string };
		close: void;
		deleteBoard: { id: string };
		renameBoard: { id: string; name: string };
	}>();

	let contextMenu = {
		show: false,
		x: 0,
		y: 0,
		boardId: ''
	};
	let renameInput = '';
	let isRenaming = false;

	function handleCreateNew() {
		dispatch('createNew');
	}

	function handleSelectBoard(id: string) {
		if (id !== currentWhiteboardId) {
			dispatch('selectBoard', { id });
		}
	}

	function handleClose() {
		dispatch('close');
	}

	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleRightClick(event: MouseEvent, boardId: string) {
		event.preventDefault();
		contextMenu = {
			show: true,
			x: event.clientX,
			y: event.clientY,
			boardId
		};
	}

	function closeContextMenu() {
		contextMenu.show = false;
		isRenaming = false;
	}

	function handleDeleteBoard() {
		if (contextMenu.boardId) {
			dispatch('deleteBoard', { id: contextMenu.boardId });
		}
		closeContextMenu();
	}

	function startRename() {
		const board = whiteboards.find(wb => wb.id === contextMenu.boardId);
		if (board) {
			renameInput = board.name;
			isRenaming = true;
			contextMenu.show = false; // Hide context menu when opening rename modal
		}
	}

	function handleRename() {
		if (contextMenu.boardId && renameInput.trim()) {
			dispatch('renameBoard', { id: contextMenu.boardId, name: renameInput.trim() });
		}
		closeContextMenu();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && isRenaming) {
			handleRename();
		} else if (event.key === 'Escape') {
			closeContextMenu();
		}
	}
</script>

<!-- Backdrop -->
{#if isOpen}
	<div class="backdrop" onclick={handleClose}></div>
{/if}

<!-- Drawer -->
<div class="drawer" class:open={isOpen}>
	<div class="drawer-handle" onclick={handleClose}>
		<div class="handle-bar"></div>
	</div>
	
	<div class="drawer-content">
		<div class="drawer-header">
			<h3 class="m3-title-medium">Whiteboards</h3>
			<p class="m3-body-small">{whiteboards.length} board{whiteboards.length !== 1 ? 's' : ''}</p>
		</div>

		<div class="whiteboards-container">
			<!-- Create New Button -->
			<div class="create-new-section">
				<Button 
					variant="filled" 
					click={handleCreateNew}
					style="height: 120px; min-width: 80px; flex-direction: column; gap: 0.5rem;"
				>
					<span style="font-size: 24px;">+</span>
					<span class="m3-body-small">New Board</span>
				</Button>
			</div>

			<!-- Whiteboards List -->
			<div class="whiteboards-list">
				{#each whiteboards as whiteboard (whiteboard.id)}
					<button 
						class="whiteboard-card"
						class:active={whiteboard.id === currentWhiteboardId}
						onclick={() => handleSelectBoard(whiteboard.id)}
						oncontextmenu={(e) => handleRightClick(e, whiteboard.id)}
					>
						<div class="thumbnail">
							{#if whiteboard.thumbnail}
								<img src={whiteboard.thumbnail} alt="Whiteboard preview" />
							{:else}
								<div class="empty-thumbnail">
									<span class="m3-body-large">📝</span>
								</div>
							{/if}
						</div>
						<div class="card-info">
							<h4 class="m3-title-small">{whiteboard.name}</h4>
							<p class="m3-body-small">{formatDate(whiteboard.lastModified)}</p>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Context Menu -->
{#if contextMenu.show}
	<div 
		class="context-menu" 
		style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
		onclick={(e) => e.stopPropagation()}
	>
		<button class="context-item" onclick={startRename}>
			✏️ Rename
		</button>
		<button class="context-item delete" onclick={handleDeleteBoard}>
			🗑️ Delete
		</button>
	</div>
{/if}

<!-- Rename Modal -->
{#if isRenaming}
	<div class="rename-modal-backdrop" onclick={closeContextMenu}>
		<div class="rename-modal" onclick={(e) => e.stopPropagation()}>
			<h4 class="m3-title-medium">Rename Whiteboard</h4>
			<input 
				type="text" 
				bind:value={renameInput}
				onkeydown={handleKeydown}
				placeholder="Enter board name"
				class="rename-input"
				autofocus
			/>
			<div class="modal-actions">
				<Button variant="outlined" click={closeContextMenu}>Cancel</Button>
				<Button variant="filled" click={handleRename}>Rename</Button>
			</div>
		</div>
	</div>
{/if}

<svelte:window onclick={(e) => {
	// Only close if clicking outside context menu and rename modal
	if (!isRenaming && contextMenu.show) {
		const target = e.target as Element;
		if (!target.closest('.context-menu')) {
			closeContextMenu();
		}
	}
}} />

<style>
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		z-index: 98;
		opacity: 0;
		animation: fadeIn 0.3s ease forwards;
	}

	@keyframes fadeIn {
		to { opacity: 1; }
	}

	.drawer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgb(var(--m3-scheme-surface-container));
		border-radius: var(--m3-util-rounding-large) var(--m3-util-rounding-large) 0 0;
		box-shadow: var(--m3-util-elevation-4);
		z-index: 99;
		transform: translateY(100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		max-height: 50vh;
		min-height: 200px;
	}

	.drawer.open {
		transform: translateY(0);
	}

	.drawer-handle {
		display: flex;
		justify-content: center;
		padding: 0.75rem;
		cursor: pointer;
	}

	.handle-bar {
		width: 32px;
		height: 4px;
		background: rgb(var(--m3-scheme-on-surface-variant));
		border-radius: 2px;
		opacity: 0.4;
	}

	.drawer-content {
		padding: 0 1.5rem 1.5rem;
		height: calc(100% - 60px);
		display: flex;
		flex-direction: column;
	}

	.drawer-header {
		margin-bottom: 1rem;
		border-bottom: 1px solid rgb(var(--m3-scheme-outline-variant));
		padding-bottom: 1rem;
	}

	.drawer-header h3 {
		margin: 0 0 0.25rem 0;
		color: rgb(var(--m3-scheme-on-surface));
	}

	.drawer-header p {
		margin: 0;
		color: rgb(var(--m3-scheme-on-surface-variant));
	}

	.whiteboards-container {
		display: flex;
		gap: 1rem;
		height: 100%;
		overflow: hidden;
	}

	.create-new-section {
		flex-shrink: 0;
		display: flex;
		align-items: stretch;
	}

	.whiteboards-list {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		flex: 1;
		padding: 0.5rem 0 0.5rem 0;
		scrollbar-width: thin;
		scrollbar-color: rgb(var(--m3-scheme-outline-variant)) transparent;
	}

	.whiteboards-list::-webkit-scrollbar {
		height: 6px;
	}

	.whiteboards-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.whiteboards-list::-webkit-scrollbar-thumb {
		background: rgb(var(--m3-scheme-outline-variant));
		border-radius: 3px;
	}

	.whiteboard-card {
		flex-shrink: 0;
		width: 140px;
		background: rgb(var(--m3-scheme-surface));
		border: 2px solid rgb(var(--m3-scheme-outline-variant));
		border-radius: var(--m3-util-rounding-medium);
		padding: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: left;
	}

	.whiteboard-card:hover {
		border-color: rgb(var(--m3-scheme-primary));
		transform: translateY(-2px);
		box-shadow: var(--m3-util-elevation-2);
	}

	.whiteboard-card.active {
		border-color: rgb(var(--m3-scheme-primary));
		background: rgb(var(--m3-scheme-primary-container));
		box-shadow: var(--m3-util-elevation-1);
	}

	.thumbnail {
		width: 100%;
		height: 60px;
		border-radius: var(--m3-util-rounding-small);
		overflow: hidden;
		background: rgb(var(--m3-scheme-surface-dim));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.empty-thumbnail {
		color: rgb(var(--m3-scheme-on-surface-variant));
	}

	.card-info h4 {
		margin: 0;
		color: rgb(var(--m3-scheme-on-surface));
		font-size: 0.875rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-info p {
		margin: 0;
		color: rgb(var(--m3-scheme-on-surface-variant));
		font-size: 0.75rem;
	}

	.context-menu {
		position: fixed;
		background: rgb(var(--m3-scheme-surface-container-high));
		border-radius: var(--m3-util-rounding-medium);
		box-shadow: var(--m3-util-elevation-3);
		z-index: 1000;
		min-width: 120px;
		overflow: hidden;
		border: 1px solid rgb(var(--m3-scheme-outline-variant));
	}

	.context-item {
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: rgb(var(--m3-scheme-on-surface));
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background-color 0.2s ease;
	}

	.context-item:hover {
		background: rgb(var(--m3-scheme-surface-container-highest));
	}

	.context-item.delete {
		color: rgb(var(--m3-scheme-error));
	}

	.context-item.delete:hover {
		background: rgba(var(--m3-scheme-error), 0.08);
	}

	.rename-modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1001;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rename-modal {
		background: rgb(var(--m3-scheme-surface-container));
		border-radius: var(--m3-util-rounding-large);
		padding: 1.5rem;
		min-width: 300px;
		max-width: 400px;
		box-shadow: var(--m3-util-elevation-4);
	}

	.rename-modal h4 {
		margin: 0 0 1rem 0;
		color: rgb(var(--m3-scheme-on-surface));
	}

	.rename-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid rgb(var(--m3-scheme-outline));
		border-radius: var(--m3-util-rounding-small);
		background: rgb(var(--m3-scheme-surface));
		color: rgb(var(--m3-scheme-on-surface));
		font-size: 1rem;
		margin-bottom: 1.5rem;
		transition: border-color 0.2s ease;
	}

	.rename-input:focus {
		outline: none;
		border-color: rgb(var(--m3-scheme-primary));
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.drawer {
			max-height: 60vh;
		}
		
		.whiteboards-container {
			flex-direction: column;
			gap: 0.75rem;
		}

		.create-new-section {
			order: -1;
		}

		.whiteboards-list {
			flex-direction: row;
			overflow-x: auto;
		}

		.whiteboard-card {
			width: 120px;
		}

		.rename-modal {
			margin: 1rem;
			min-width: unset;
		}
	}
</style> 