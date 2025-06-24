<script lang="ts">
	import { onMount } from 'svelte';
	import { drawingStore } from '$lib/stores/drawing.svelte';
	import { websocketStore } from '$lib/stores/websocket.svelte';
	import { collaborationStore } from '$lib/stores/collaboration.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
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
	let isPanning = false;
	let lastPanPoint: Point | null = null;

	// Create reactive cursor class based on current tool
	let cursorClass = $state('cursor-crosshair');
	
	// Get collaboration settings
	let showOtherCursors = $derived(settingsStore.collaboration.showOtherCursors);
	
	$effect(() => {
		switch (drawingStore.currentTool.type) {
			case 'hand':
				cursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
				break;
			case 'eraser':
				cursorClass = 'cursor-pointer';
				break;
			case 'stroke_eraser':
				cursorClass = 'cursor-crosshair';
				break;
			default:
				cursorClass = 'cursor-crosshair';
		}
	});

	onMount(() => {
		// Set up canvas immediately with fixed dimensions
		if (canvas) {
			setupCanvas();
		}
		
		// Global mouse event listeners to track mouse state even when cursor leaves canvas
		const handleGlobalMouseUp = (event: Event) => {
			if (isMouseDown) {
				isMouseDown = false;
				if (isDrawing) {
					isDrawing = false;
					drawingStore.endStroke();
					lastPoint = null;
				}
				if (isPanning) {
					isPanning = false;
					drawingStore.isPanning = false;
					lastPanPoint = null;
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
				if (isPanning) {
					isPanning = false;
					drawingStore.isPanning = false;
					lastPanPoint = null;
				}
			}
		};
		
		window.addEventListener('mouseup', handleGlobalMouseUp);
		window.addEventListener('touchend', handleGlobalTouchEnd);
		
		return () => {
			window.removeEventListener('mouseup', handleGlobalMouseUp);
			window.removeEventListener('touchend', handleGlobalTouchEnd);
		};
	});

	function setupCanvas() {
		if (!canvas) return;
		
		// Use fixed viewport dimensions for immediate sizing
		const width = window.innerWidth;
		const height = window.innerHeight;
		
		// Set canvas size with device pixel ratio for crisp rendering
		canvas.width = width * window.devicePixelRatio;
		canvas.height = height * window.devicePixelRatio;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		
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
        
		const point = getEventPoint(event);
		
		if (drawingStore.currentTool.type === 'hand') {
			// Start panning
			isPanning = true;
			drawingStore.isPanning = true;
			lastPanPoint = point;
		} else {
			// Start drawing
			isDrawing = true;
			lastPoint = point;
			drawingStore.startStroke(point);
		}
	}

	function handlePointerMove(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		
		const point = getEventPoint(event);
		
		// Send cursor position to collaborators only if others' cursors are enabled (in screen coordinates)
		if (showOtherCursors) {
			websocketStore.sendCursorMove(point.x, point.y);
		}
		
		// Update cursor for stroke eraser (hover highlighting)
		if (drawingStore.currentTool.type === 'stroke_eraser') {
			drawingStore.updateCursor(point);
		}
		
		if (isPanning && lastPanPoint) {
			// Handle panning
			const deltaX = point.x - lastPanPoint.x;
			const deltaY = point.y - lastPanPoint.y;
			drawingStore.pan(deltaX, deltaY);
			lastPanPoint = point;
		} else if (isDrawing && lastPoint) {
			// Handle drawing
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
		
		if (isPanning) {
			isPanning = false;
			drawingStore.isPanning = false;
			lastPanPoint = null;
		}
	}

	function handlePointerEnter(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		
		// If mouse is still down when re-entering canvas, resume appropriate action
		if (isMouseDown) {
			const point = getEventPoint(event);
			
			if (drawingStore.currentTool.type === 'hand' && !isPanning) {
				isPanning = true;
				drawingStore.isPanning = true;
				lastPanPoint = point;
			} else if (drawingStore.currentTool.type !== 'hand' && !isDrawing) {
				isDrawing = true;
				lastPoint = point;
				drawingStore.startStroke(point);
			}
		}
	}

	function handlePointerLeave(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		// Don't end the action when leaving canvas - let global mouse up handle it
		// This allows drawing/panning to continue when cursor re-enters
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
		} else {
			// Tool shortcuts
			switch (event.key) {
				case 'h':
					event.preventDefault();
					drawingStore.setTool({ ...drawingStore.currentTool, type: 'hand' });
					break;
				case 'p':
					event.preventDefault();
					drawingStore.setTool({ ...drawingStore.currentTool, type: 'pen', opacity: 1 });
					break;
				case 'e':
					event.preventDefault();
					drawingStore.setTool({ ...drawingStore.currentTool, type: 'eraser', opacity: 1 });
					break;
				case 'E': // Shift+E for stroke eraser
					event.preventDefault();
					drawingStore.setTool({ ...drawingStore.currentTool, type: 'stroke_eraser', opacity: 1 });
					break;
				case '0':
					event.preventDefault();
					drawingStore.resetView();
					break;
			}
		}
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		
		const point = getEventPoint(event);
		const zoomDelta = event.deltaY > 0 ? 1 / 1.1 : 1.1;
		
		drawingStore.zoomAt(point, zoomDelta);
		
		// Automatically switch to hand tool when zooming
		if (drawingStore.currentTool.type !== 'hand') {
			drawingStore.setTool({ ...drawingStore.currentTool, type: 'hand' });
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div 
	bind:this={canvasContainer}
	class="fixed inset-0 {cursorClass}"
	style="touch-action: none;"
>
	<canvas
		bind:this={canvas}
		class="fixed inset-0 block bg-surface-container-high"
		style="width: 100vw; height: 100vh;"
		onmousedown={handlePointerDown}
		onmousemove={handlePointerMove}
		onmouseup={handlePointerUp}
		onmouseenter={handlePointerEnter}
		onmouseleave={handlePointerLeave}
		ontouchstart={handlePointerDown}
		ontouchmove={handlePointerMove}
		ontouchend={handlePointerUp}
		onwheel={handleWheel}
	></canvas>
</div>

