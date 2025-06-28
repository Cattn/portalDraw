<script lang="ts">
	import { onMount } from 'svelte';
	import { drawingStore } from '$lib/stores/drawing.svelte';
	import { websocketStore } from '$lib/stores/websocket.svelte';
	import { collaborationStore } from '$lib/stores/collaboration.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { Board, Point, DrawingTool } from '$lib/types';

	interface Props {
		board: Board;
	}

	let { board }: Props = $props();

	let canvas: HTMLCanvasElement;
	let canvasContainer: HTMLDivElement;
	let isDrawing = false;
	let lastPoint: Point | null = null;
	let isMouseDown = false;
	let isPanning = false;
	let lastPanPoint: Point | null = null;

	let isPinching = false;
	let lastPinchDistance: number | null = null;
	let lastPinchCenter: Point | null = null;
	let toolBeforePinch: DrawingTool | null = null;

	let cursorClass = $state('cursor-crosshair');

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
		if (canvas) {
			setupCanvas();
		}

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
			if (isPinching && event.touches.length < 2) {
				isPinching = false;
				lastPinchDistance = null;
				lastPinchCenter = null;

				if (toolBeforePinch) {
					drawingStore.setTool(toolBeforePinch);
					toolBeforePinch = null;
				}
			}

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

		const width = window.innerWidth;
		const height = window.innerHeight;

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
		const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
		const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;

		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	function getTouchDistance(touch1: Touch, touch2: Touch): number {
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getTouchCenter(touch1: Touch, touch2: Touch): Point {
		const rect = canvas.getBoundingClientRect();
		return {
			x: (touch1.clientX + touch2.clientX) / 2 - rect.left,
			y: (touch1.clientY + touch2.clientY) / 2 - rect.top
		};
	}

	function handlePointerDown(event: MouseEvent | TouchEvent) {
		event.preventDefault();

		if ('touches' in event && event.touches.length === 2) {
			isPinching = true;
			lastPinchDistance = getTouchDistance(event.touches[0], event.touches[1]);
			lastPinchCenter = getTouchCenter(event.touches[0], event.touches[1]);

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

			if (drawingStore.currentTool.type !== 'hand') {
				toolBeforePinch = { ...drawingStore.currentTool };
				drawingStore.setTool({ ...drawingStore.currentTool, type: 'hand' });
			}

			return;
		}

		if ('touches' in event && event.touches.length > 1) {
			return;
		}

		isMouseDown = true;

		const point = getEventPoint(event);

		if (drawingStore.currentTool.type === 'hand') {
			isPanning = true;
			drawingStore.isPanning = true;
			lastPanPoint = point;
		} else {
			isDrawing = true;
			lastPoint = point;
			drawingStore.startStroke(point);
		}
	}

	function handlePointerMove(event: MouseEvent | TouchEvent) {
		event.preventDefault();

		if ('touches' in event && event.touches.length === 2 && isPinching) {
			const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
			const currentCenter = getTouchCenter(event.touches[0], event.touches[1]);

			if (lastPinchDistance && lastPinchCenter) {
				const zoomDelta = currentDistance / lastPinchDistance;

				drawingStore.zoomAt(currentCenter, zoomDelta);

				lastPinchDistance = currentDistance;
				lastPinchCenter = currentCenter;
			}

			return;
		}

		if ('touches' in event && event.touches.length > 1) {
			return;
		}

		const point = getEventPoint(event);

		if (showOtherCursors) {
			websocketStore.sendCursorMove(point.x, point.y);
		}

		if (drawingStore.currentTool.type === 'stroke_eraser') {
			drawingStore.updateCursor(point);
		}

		if (isPanning && lastPanPoint) {
			const deltaX = point.x - lastPanPoint.x;
			const deltaY = point.y - lastPanPoint.y;
			drawingStore.pan(deltaX, deltaY);
			lastPanPoint = point;
		} else if (isDrawing && lastPoint) {
			drawingStore.addPoint(point);
			lastPoint = point;
		}
	}

	function handlePointerUp(event: MouseEvent | TouchEvent) {
		event.preventDefault();

		if ('touches' in event && isPinching) {
			if (event.touches.length < 2) {
				isPinching = false;
				lastPinchDistance = null;
				lastPinchCenter = null;

				if (toolBeforePinch) {
					drawingStore.setTool(toolBeforePinch);
					toolBeforePinch = null;
				}
			}
			return;
		}

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
				case 'E':
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

		if (drawingStore.currentTool.type !== 'hand') {
			drawingStore.setTool({ ...drawingStore.currentTool, type: 'hand' });
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div bind:this={canvasContainer} class="fixed inset-0 {cursorClass}" style="touch-action: none;">
	<canvas
		bind:this={canvas}
		class="bg-surface-container-high fixed inset-0 block"
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
