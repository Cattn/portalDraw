<script lang="ts">
	import { onMount } from 'svelte';
	import { drawingStore } from '$lib/stores/drawing.svelte';
	import { websocketStore } from '$lib/stores/websocket.svelte';
	import { collaborationStore } from '$lib/stores/collaboration.svelte';
	import type { Board, Point } from '$lib/types';

	interface Props {
		board: Board;
	}

	let { board }: Props = $props();
	
	let canvas: HTMLCanvasElement;
	let canvasContainer: HTMLDivElement;
	let isDrawing = false;
	let lastPoint: Point | null = null;
	let isMouseDown = false; // Track global mouse state

	onMount(() => {
		// Set up canvas
		setupCanvas();
		
		// Handle window resize
		const handleResize = () => {
			setupCanvas();
		};
		window.addEventListener('resize', handleResize);
		
		// Global mouse event listeners to track mouse state even when cursor leaves canvas
		const handleGlobalMouseUp = (event: Event) => {
			if (isMouseDown) {
				isMouseDown = false;
				if (isDrawing) {
					isDrawing = false;
					drawingStore.endStroke();
					lastPoint = null;
				}
			}
		};
		
		const handleGlobalTouchEnd = (event: TouchEvent) => {
			if (isMouseDown) {
				isMouseDown = false;
				if (isDrawing) {
					isDrawing = false;
					drawingStore.endStroke();
					lastPoint = null;
				}
			}
		};
		
		window.addEventListener('mouseup', handleGlobalMouseUp);
		window.addEventListener('touchend', handleGlobalTouchEnd);
		
		// Use ResizeObserver for better container size detection
		const resizeObserver = new ResizeObserver(() => {
			setupCanvas();
		});
		
		if (canvasContainer) {
			resizeObserver.observe(canvasContainer);
		}
		
		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mouseup', handleGlobalMouseUp);
			window.removeEventListener('touchend', handleGlobalTouchEnd);
			resizeObserver.disconnect();
		};
	});

	function setupCanvas() {
		if (!canvas || !canvasContainer) return;
		
		const rect = canvasContainer.getBoundingClientRect();
		
		// Set canvas size to exactly match container
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = rect.height * window.devicePixelRatio;
		canvas.style.width = rect.width + 'px';
		canvas.style.height = rect.height + 'px';
		
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		}
		
		drawingStore.initCanvas(canvas);
	}

	function getEventPoint(event: MouseEvent | TouchEvent): Point {
		const rect = canvas.getBoundingClientRect();
		const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
		const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;
		
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	function handlePointerDown(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		isMouseDown = true;
		isDrawing = true;
		
		const point = getEventPoint(event);
		lastPoint = point;
		drawingStore.startStroke(point);
	}

	function handlePointerMove(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		
		const point = getEventPoint(event);
		
		// Send cursor position to collaborators
		websocketStore.sendCursorMove(point.x, point.y);
		
		if (isDrawing && lastPoint) {
			drawingStore.addPoint(point);
			lastPoint = point;
		}
	}

	function handlePointerUp(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		isMouseDown = false;
		
		if (isDrawing) {
			isDrawing = false;
			drawingStore.endStroke();
			lastPoint = null;
		}
	}

	function handlePointerEnter(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		
		// If mouse is still down when re-entering canvas, resume drawing
		if (isMouseDown && !isDrawing) {
			isDrawing = true;
			const point = getEventPoint(event);
			lastPoint = point;
			drawingStore.startStroke(point);
		}
	}

	function handlePointerLeave(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		// Don't end the stroke when leaving canvas - let global mouse up handle it
		// This allows drawing to continue when cursor re-enters
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case 'z':
					event.preventDefault();
					if (event.shiftKey) {
						drawingStore.redo();
					} else {
						drawingStore.undo();
					}
					break;
				case 'y':
					event.preventDefault();
					drawingStore.redo();
					break;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div 
	bind:this={canvasContainer}
	class="absolute inset-0 cursor-crosshair grid-background"
	style="touch-action: none;"
>
	<canvas
		bind:this={canvas}
		class="absolute inset-0 block w-full h-full bg-transparent"
		onmousedown={handlePointerDown}
		onmousemove={handlePointerMove}
		onmouseup={handlePointerUp}
		onmouseenter={handlePointerEnter}
		onmouseleave={handlePointerLeave}
		ontouchstart={handlePointerDown}
		ontouchmove={handlePointerMove}
		ontouchend={handlePointerUp}
	></canvas>
</div>

<style>
	.grid-background {
		background-color: white;
		background-image: 
			linear-gradient(to right, #f0f0f0 1px, transparent 1px),
			linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
		background-size: 20px 20px;
	}
</style>
