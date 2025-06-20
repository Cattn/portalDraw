<script lang="ts">
	import { Button, Slider } from 'm3-svelte';
	
	export let onColorChange: (color: string) => void = () => {};
	export let onWidthChange: (width: number) => void = () => {};
	export let onUndo: () => void = () => {};
	export let onClear: () => void = () => {};
	export let onSave: () => void = () => {};
	export let onZoomIn: () => void = () => {};
	export let onZoomOut: () => void = () => {};
	export let onResetView: () => void = () => {};
	export let currentZoom: number = 1;

	let selectedColor = '#6B4FE8';
	let brushWidth = 3;

	const colors = [
		'#6B4FE8', // Primary
		'#E91E63', // Pink
		'#4CAF50', // Green
		'#FF9800', // Orange
		'#2196F3', // Blue
		'#9C27B0', // Purple
		'#F44336', // Red
		'#795548', // Brown
		'#607D8B', // Blue Grey
		'#000000', // Black
	];

	function selectColor(color: string) {
		selectedColor = color;
		onColorChange(color);
	}

	$: onWidthChange(brushWidth);
</script>

<div class="toolbar">
	<div class="section">
		<h3 class="m3-title-small">Tools</h3>
		<div class="tool-buttons">
			<Button variant="outlined" click={onUndo}>
				↶ Undo
			</Button>
			<Button variant="outlined" click={onClear}>
				🗑️ Clear
			</Button>
			<Button variant="filled" click={onSave}>
				💾 Save
			</Button>
		</div>
	</div>

	<div class="section">
		<h3 class="m3-title-small">View</h3>
		<div class="view-controls">
			<div class="zoom-controls">
				<Button variant="outlined" click={onZoomOut}>−</Button>
				<span class="m3-body-small">{Math.round(currentZoom * 100)}%</span>
				<Button variant="outlined" click={onZoomIn}>+</Button>
			</div>
			<Button variant="outlined" click={onResetView}>Reset View</Button>
		</div>
	</div>

	<div class="section">
		<h3 class="m3-title-small">Brush Size</h3>
		<div class="brush-size">
			<Slider
				min={1}
				max={20}
				step={1}
				bind:value={brushWidth}
			/>
			<span class="m3-body-medium">{brushWidth}px</span>
		</div>
	</div>

	<div class="section">
		<h3 class="m3-title-small">Colors</h3>
		<div class="color-palette">
			{#each colors as color}
				<button
					class="color-button"
					class:selected={selectedColor === color}
					style="background-color: {color};"
					onclick={() => selectColor(color)}
					aria-label="Select color {color}"
				></button>
			{/each}
		</div>
	</div>
</div>

<style>
	.toolbar {
		padding: 1rem;
		background: rgb(var(--m3-scheme-surface-container));
		border-radius: var(--m3-util-rounding-large);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 200px;
		max-width: 250px;
		height: fit-content;
		box-shadow: var(--m3-util-elevation-2);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tool-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.view-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.zoom-controls span {
		min-width: 45px;
		text-align: center;
		font-weight: 500;
	}

	.brush-size {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.color-palette {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
	}

	.color-button {
		width: 32px;
		height: 32px;
		border: 2px solid transparent;
		border-radius: var(--m3-util-rounding-small);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.color-button:hover {
		transform: scale(1.1);
		box-shadow: var(--m3-util-elevation-1);
	}

	.color-button.selected {
		border-color: rgb(var(--m3-scheme-primary));
		box-shadow: var(--m3-util-elevation-2);
		transform: scale(1.1);
	}

	h3 {
		margin: 0;
		color: rgb(var(--m3-scheme-on-surface));
	}
</style> 