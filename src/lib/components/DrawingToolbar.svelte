<script lang="ts">
	import { Button } from 'm3-svelte';
	import { drawingStore } from '$lib/stores/drawing.svelte';
	import type { DrawingTool } from '$lib/types';

	interface Props {
		toolbarCollapsed: boolean;
		toggleToolbar: () => void;
	}

	let { toolbarCollapsed, toggleToolbar }: Props = $props();

	const tools: { type: DrawingTool['type']; label: string; icon: string }[] = [
		{ type: 'hand', label: 'Hand', icon: '✋' },
		{ type: 'pen', label: 'Pen', icon: '✏️' },
		{ type: 'highlighter', label: 'Highlighter', icon: '🖍️' },
		{ type: 'eraser', label: 'Pixel Eraser', icon: '🧽' },
		{ type: 'stroke_eraser', label: 'Stroke Eraser', icon: '⚡' }
	];

	const sizes = [1, 2, 4, 8, 16];
	const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

	// Create reactive variables to track the current state
	let currentTool = $state<DrawingTool>({
		type: 'pen',
		size: 2,
		opacity: 1
	});
	let currentColor = $state('#000000');
	

	
	// Update reactive variables when store state changes
	$effect(() => {
		currentTool = drawingStore.currentTool;
		currentColor = drawingStore.currentColor;
	});

	function selectTool(type: DrawingTool['type']) {
		drawingStore.setTool({
			...drawingStore.currentTool,
			type,
			opacity: type === 'highlighter' ? 0.5 : 1
		});
	}

	function selectSize(size: number) {
		drawingStore.setTool({
			...drawingStore.currentTool,
			size
		});
	}

	function selectColor(color: string) {
		drawingStore.setColor(color);
	}



	function zoomIn() {
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;
		drawingStore.zoomAt({ x: centerX, y: centerY }, 1.2);
	}
	
	function zoomOut() {
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;
		drawingStore.zoomAt({ x: centerX, y: centerY }, 1 / 1.2);
	}
	
	function resetZoom() {
		drawingStore.resetView();
	}


</script>

<div class="flex items-center gap-4 p-3 bg-surface-container-high">
	<!-- Collapse button -->
	<Button variant="tonal" onclick={toggleToolbar} square title="Collapse toolbar" aria-label="Collapse toolbar">
		↑
	</Button>
	
	<!-- Tools -->
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium">Tools:</span>
		{#each tools as tool}
			<Button
				variant={currentTool.type === tool.type ? 'filled' : 'tonal'}
				onclick={() => selectTool(tool.type)}
				square
				title={tool.label}
				aria-label={tool.label}
			>
				{tool.icon}
			</Button>
		{/each}
	</div>

	<!-- Size (hide for hand tool) -->
	{#if currentTool.type !== 'hand'}
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium">
				{#if currentTool.type === 'stroke_eraser'}
					Detection radius:
				{:else if currentTool.type === 'eraser'}
					Brush size:
				{:else}
					Size:
				{/if}
			</span>
			{#each sizes as size}
				<Button
					variant={currentTool.size === size ? 'filled' : 'tonal'}
					onclick={() => selectSize(size)}
					square
					title={`Size ${size}`}
					aria-label={`Brush size ${size}`}
				>
					<div 
						class="rounded-full bg-current"
						style="width: {Math.min(size * 2, 16)}px; height: {Math.min(size * 2, 16)}px;"
					></div>
				</Button>
			{/each}
		</div>
	{/if}

	<!-- Colors (hide for hand tool and erasers) -->
	{#if currentTool.type !== 'hand' && currentTool.type !== 'eraser' && currentTool.type !== 'stroke_eraser'}
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium">Color:</span>
			{#each colors as color}
				<button
					type="button"
					class="w-8 h-8 rounded border-2 {currentColor === color ? 'border-gray-400' : 'border-gray-200'}"
					style="background-color: {color};"
					onclick={() => selectColor(color)}
					title={color}
					aria-label={`Select color ${color}`}
				></button>
			{/each}
			
			<!-- Custom color picker -->
			<input
				type="color"
				value={currentColor}
				onchange={(e) => selectColor(e.currentTarget.value)}
				class="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer"
				title="Custom color"
				aria-label="Select custom color"
			/>
		</div>
	{/if}

	<!-- Zoom controls -->
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium">Zoom:</span>
		<Button variant="tonal" onclick={zoomOut} square title="Zoom out" aria-label="Zoom out">
			−
		</Button>
		<Button variant="tonal" onclick={resetZoom} title="Reset zoom" aria-label="Reset zoom">
			{Math.round(drawingStore.zoom * 100)}%
		</Button>
		<Button variant="tonal" onclick={zoomIn} square title="Zoom in" aria-label="Zoom in">
			+
		</Button>
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-2 ml-auto">
		<Button variant="tonal" onclick={() => drawingStore.undo()} aria-label="Undo last action">
			Undo
		</Button>
		<Button variant="tonal" onclick={() => drawingStore.redo()} aria-label="Redo last action">
			Redo
		</Button>
		<Button 
			variant="tonal" 
			onclick={() => {
				if (confirm('Clear the entire canvas? This action cannot be undone.')) {
					drawingStore.clear();
				}
			}}
			aria-label="Clear entire canvas"
		>
			Clear
		</Button>
	</div>
</div>
