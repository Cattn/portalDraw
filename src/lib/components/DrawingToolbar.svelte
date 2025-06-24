<script lang="ts">
	import { Button } from 'm3-svelte';
	import { drawingStore } from '$lib/stores/drawing.svelte';
	import type { DrawingTool } from '$lib/types';

	const tools: { type: DrawingTool['type']; label: string; icon: string }[] = [
		{ type: 'pen', label: 'Pen', icon: '✏️' },
		{ type: 'highlighter', label: 'Highlighter', icon: '🖍️' },
		{ type: 'eraser', label: 'Eraser', icon: '🧽' }
	];

	const sizes = [1, 2, 4, 8, 16];
	const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

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
</script>

<div class="flex items-center gap-4 p-3">
	<!-- Tools -->
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium">Tools:</span>
		{#each tools as tool}
			<Button
				variant={drawingStore.currentTool.type === tool.type ? 'filled' : 'outlined'}
				onclick={() => selectTool(tool.type)}
				square
				title={tool.label}
				aria-label={tool.label}
			>
				{tool.icon}
			</Button>
		{/each}
	</div>

	<!-- Size -->
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium">Size:</span>
		{#each sizes as size}
			<Button
				variant={drawingStore.currentTool.size === size ? 'filled' : 'outlined'}
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

	<!-- Colors -->
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium">Color:</span>
		{#each colors as color}
			<button
				type="button"
				class="w-8 h-8 rounded border-2 {drawingStore.currentColor === color ? 'border-gray-400' : 'border-gray-200'}"
				style="background-color: {color};"
				onclick={() => selectColor(color)}
				title={color}
				aria-label={`Select color ${color}`}
			></button>
		{/each}
		
		<!-- Custom color picker -->
		<input
			type="color"
			value={drawingStore.currentColor}
			onchange={(e) => selectColor(e.currentTarget.value)}
			class="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer"
			title="Custom color"
			aria-label="Select custom color"
		/>
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-2 ml-auto">
		<Button variant="outlined" onclick={() => drawingStore.undo()} aria-label="Undo last action">
			Undo
		</Button>
		<Button variant="outlined" onclick={() => drawingStore.redo()} aria-label="Redo last action">
			Redo
		</Button>
		<Button 
			variant="outlined" 
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
