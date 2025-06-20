<script lang="ts">
	import { onMount } from 'svelte';

	interface Point {
		x: number;
		y: number;
	}

	interface Stroke {
		points: Point[];
		color: string;
		width: number;
	}

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDrawing = false;
	let isMouseDown = false;
	let isPanning = false;
	let currentStroke: Point[] = [];
	let strokes: Stroke[] = [];
	let currentColor = '#6B4FE8'; // M3 primary color
	let currentWidth = 3;

	// Zoom and pan state
	let zoom = 1;
	let panX = 0;
	let panY = 0;
	let lastPanPoint: Point | null = null;
	let dirty = false;

	export let width = 800;
	export let height = 600;
	export let onStrokeAdded: (stroke: Stroke) => void = () => {};
	export let onClear: () => void = () => {};
	export let onZoomChange: (zoom: number) => void = () => {};

	$: if (canvas) {
		ctx = canvas.getContext('2d')!;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
	}

	// Redraw canvas when dimensions change (e.g., fullscreen toggle)
	$: if (canvas && ctx && (width || height)) {
		// Small delay to ensure canvas has been resized
		setTimeout(() => {
			requestRedraw();
		}, 10);
	}

	onMount(() => {
		// Add global mouse up listener to track mouse state
		function handleGlobalMouseUp() {
			isMouseDown = false;
			stopDrawing();
		}
		
		window.addEventListener('mouseup', handleGlobalMouseUp);
		return () => {
			window.removeEventListener('mouseup', handleGlobalMouseUp);
		};
	});

	function requestRedraw() {
		if (!dirty) {
			dirty = true;
			requestAnimationFrame(() => {
				redrawCanvas();
				dirty = false;
			});
		}
	}

	function startDrawing(event: MouseEvent | TouchEvent) {
		isDrawing = true;
		isMouseDown = true;
		const point = getPoint(event);
		currentStroke = [point];
		requestRedraw();
	}

	function draw(event: MouseEvent | TouchEvent) {
		if (!isDrawing) return;

		const point = getPoint(event);
		currentStroke.push(point);

		requestRedraw();
	}

	function stopDrawing() {
		if (!isDrawing) return;
		isDrawing = false;
		
		if (currentStroke.length > 0) {
			const stroke: Stroke = {
				points: [...currentStroke],
				color: currentColor,
				width: currentWidth
			};
			
			strokes = [...strokes, stroke];
			onStrokeAdded(stroke);
			currentStroke = [];
			requestRedraw();
		}
	}

	function handleMouseEnter(event: MouseEvent) {
		// If mouse is down and we're re-entering, resume drawing
		if (isMouseDown && !isDrawing) {
			isDrawing = true;
			const point = getPoint(event);
			currentStroke = [point];
		}
	}

	function handleMouseLeave() {
		// Don't stop drawing, just pause it while mouse is outside
		isDrawing = false;
		isPanning = false;
		lastPanPoint = null;
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		
		// Calculate zoom
		const delta = event.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
		
		// Zoom towards mouse position
		const zoomFactor = newZoom / zoom;
		panX = mouseX - (mouseX - panX) * zoomFactor;
		panY = mouseY - (mouseY - panY) * zoomFactor;
		
		zoom = newZoom;
		onZoomChange(zoom);
		requestRedraw();
	}

	function handleMouseDown(event: MouseEvent) {
		if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
			// Middle mouse button or Ctrl+Left click for panning
			event.preventDefault();
			isPanning = true;
			lastPanPoint = getScreenPoint(event);
		} else if (event.button === 0 && !event.ctrlKey) {
			// Left click for drawing
			startDrawing(event);
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isPanning && lastPanPoint) {
			const currentPoint = getScreenPoint(event);
			panX += currentPoint.x - lastPanPoint.x;
			panY += currentPoint.y - lastPanPoint.y;
			lastPanPoint = currentPoint;
			requestRedraw();
		} else if (isDrawing) {
			draw(event);
		}
	}

	function handleMouseUp(event: MouseEvent) {
		if (isPanning) {
			isPanning = false;
			lastPanPoint = null;
		} else if (isDrawing) {
			stopDrawing();
		}
	}

	function getPoint(event: MouseEvent | TouchEvent): Point {
		const rect = canvas.getBoundingClientRect();
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		
		// Transform screen coordinates to canvas coordinates accounting for zoom and pan
		const screenX = clientX - rect.left;
		const screenY = clientY - rect.top;
		
		return {
			x: (screenX - panX) / zoom,
			y: (screenY - panY) / zoom
		};
	}

	function getScreenPoint(event: MouseEvent | TouchEvent): Point {
		const rect = canvas.getBoundingClientRect();
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	function drawStroke(points: Point[], color: string, width: number) {
		if (points.length === 0) return;

		ctx.save();

		// Apply zoom and pan transformation
		ctx.setTransform(zoom, 0, 0, zoom, panX, panY);

		ctx.strokeStyle = color;
		ctx.lineWidth = width;

		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);

		if (points.length === 1) {
			ctx.fillStyle = color;
			ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
			ctx.fill();
		} else {
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i].x, points[i].y);
			}
			ctx.stroke();
		}

		ctx.restore();
	}



	export function redrawCanvas() {
		// Clear the entire canvas including transformed areas
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
		
		strokes.forEach(stroke => {
			drawStroke(stroke.points, stroke.color, stroke.width);
		});

		if (currentStroke.length > 0) {
			drawStroke(currentStroke, currentColor, currentWidth);
		}
	}

	export function clearCanvas() {
		strokes = [];
		if (ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
		onClear();
	}

	export function setColor(color: string) {
		currentColor = color;
	}

	export function setWidth(width: number) {
		currentWidth = width;
	}

	export function undo() {
		if (strokes.length > 0) {
			strokes = strokes.slice(0, -1);
			requestRedraw();
		}
	}

	export function zoomIn() {
		const newZoom = Math.min(5, zoom * 1.2);
		zoom = newZoom;
		onZoomChange(zoom);
		requestRedraw();
	}

	export function zoomOut() {
		const newZoom = Math.max(0.1, zoom * 0.8);
		zoom = newZoom;
		onZoomChange(zoom);
		requestRedraw();
	}

	export function resetView() {
		zoom = 1;
		panX = 0;
		panY = 0;
		onZoomChange(zoom);
		requestRedraw();
	}

	export function getZoom() {
		return zoom;
	}

	export function getStrokes() {
		return strokes;
	}

	export function setStrokes(newStrokes: Stroke[]) {
		strokes = newStrokes;
		requestRedraw();
	}
</script>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<canvas
	bind:this={canvas}
	{width}
	{height}
	style="cursor: {isPanning ? 'grabbing' : 'crosshair'}; background: transparent; width: 100%; height: 100%;"
	on:mousedown={handleMouseDown}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:wheel={handleWheel}
	on:contextmenu|preventDefault
	on:touchstart|preventDefault={startDrawing}
	on:touchmove|preventDefault={draw}
	on:touchend|preventDefault={stopDrawing}
/> 