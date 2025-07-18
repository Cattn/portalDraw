import type { DrawingEvent, DrawingStroke, DrawingTool, Point } from '$lib/types';
import { settingsStore } from './settings.svelte';

class DrawingStore {
	strokes = $state<DrawingStroke[]>([]);
	currentTool = $state<DrawingTool>({
		type: 'pen',
		size: 2,
		opacity: 1
	});
	currentColor = $state('#000000');
	isDrawing = $state(false);
	currentStroke = $state<DrawingStroke | null>(null);

	panX = $state(0);
	panY = $state(0);
	zoom = $state(1);
	isPanning = $state(false);

	highlightedStrokes = $state<Set<string>>(new Set());

	private rawPoints = $state<Point[]>([]);

	private history = $state<DrawingStroke[][]>([]);
	private historyIndex = $state(-1);

	private eventSequence = $state(0);

	sessionId = $state(crypto.randomUUID());
	sessionColor = $state(this.generateRandomColor());

	canvas = $state<HTMLCanvasElement | null>(null);
	context = $state<CanvasRenderingContext2D | null>(null);

	currentBoardId = $state<string | null>(null);

	private sendDrawingEvent: ((event: DrawingEvent) => void) | null = null;
	private requestSyncEvent: ((boardId: string) => void) | null = null;

	private generateRandomColor(): string {
		const colors = [
			'#e74c3c',
			'#3498db',
			'#2ecc71',
			'#f39c12',
			'#9b59b6',
			'#1abc9c',
			'#e67e22',
			'#34495e'
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	private smoothPoints(points: Point[]): Point[] {
		if (!settingsStore.drawing.smoothStrokes || points.length < 3) {
			return points;
		}

		const smoothed: Point[] = [];
		const windowSize = Math.min(3, points.length);

		smoothed.push(points[0]);

		for (let i = 1; i < points.length - 1; i++) {
			const start = Math.max(0, i - Math.floor(windowSize / 2));
			const end = Math.min(points.length, i + Math.ceil(windowSize / 2));

			let sumX = 0,
				sumY = 0;
			let count = 0;

			for (let j = start; j < end; j++) {
				sumX += points[j].x;
				sumY += points[j].y;
				count++;
			}

			smoothed.push({
				x: sumX / count,
				y: sumY / count,
				pressure: points[i].pressure
			});
		}

		if (points.length > 1) {
			smoothed.push(points[points.length - 1]);
		}

		return smoothed;
	}

	private interpolatePoints(points: Point[]): Point[] {
		if (!settingsStore.drawing.smoothStrokes || points.length < 2) {
			return points;
		}

		const interpolated: Point[] = [];

		for (let i = 0; i < points.length - 1; i++) {
			const current = points[i];
			const next = points[i + 1];

			interpolated.push(current);

			const dx = next.x - current.x;
			const dy = next.y - current.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > 3) {
				const steps = Math.floor(distance / 2);

				for (let step = 1; step < steps; step++) {
					const t = step / steps;
					interpolated.push({
						x: current.x + dx * t,
						y: current.y + dy * t,
						pressure:
							current.pressure !== undefined && next.pressure !== undefined
								? current.pressure + (next.pressure - current.pressure) * t
								: undefined
					});
				}
			}
		}

		if (points.length > 0) {
			interpolated.push(points[points.length - 1]);
		}

		return interpolated;
	}

	private applyBezierSmoothing(points: Point[]): Point[] {
		if (!settingsStore.drawing.smoothStrokes || points.length < 3) {
			return points;
		}

		const smoothed: Point[] = [];
		smoothed.push(points[0]);

		for (let i = 1; i < points.length - 1; i++) {
			const prev = points[i - 1];
			const current = points[i];
			const next = points[i + 1];

			const cpX = (prev.x + next.x) / 2;
			const cpY = (prev.y + next.y) / 2;

			const steps = 3;
			for (let step = 0; step <= steps; step++) {
				const t = step / steps;
				const oneMinusT = 1 - t;

				const x = oneMinusT * oneMinusT * prev.x + 2 * oneMinusT * t * cpX + t * t * current.x;
				const y = oneMinusT * oneMinusT * prev.y + 2 * oneMinusT * t * cpY + t * t * current.y;

				if (step > 0 || i === 1) {
					smoothed.push({
						x,
						y,
						pressure: current.pressure
					});
				}
			}
		}

		if (points.length > 1) {
			smoothed.push(points[points.length - 1]);
		}

		return smoothed;
	}

	initCanvas(canvasElement: HTMLCanvasElement) {
		this.canvas = canvasElement;
		this.context = canvasElement.getContext('2d');
		this.redraw();
	}

	setBoardId(boardId: string) {
		this.currentBoardId = boardId;
	}

	setSendFunction(sendFn: (event: DrawingEvent) => void) {
		this.sendDrawingEvent = sendFn;
	}

	setSyncFunction(syncFn: (boardId: string) => void) {
		this.requestSyncEvent = syncFn;
	}

	screenToCanvas(screenPoint: Point): Point {
		return {
			x: (screenPoint.x - this.panX) / this.zoom,
			y: (screenPoint.y - this.panY) / this.zoom
		};
	}

	canvasToScreen(canvasPoint: Point): Point {
		return {
			x: canvasPoint.x * this.zoom + this.panX,
			y: canvasPoint.y * this.zoom + this.panY
		};
	}

	pan(deltaX: number, deltaY: number) {
		this.panX += deltaX;
		this.panY += deltaY;
		this.redraw();
	}

	zoomAt(screenPoint: Point, zoomDelta: number) {
		const oldZoom = this.zoom;
		const newZoom = Math.max(0.1, Math.min(5, oldZoom * zoomDelta));

		if (newZoom !== oldZoom) {
			const canvasPoint = this.screenToCanvas(screenPoint);

			this.zoom = newZoom;

			const newScreenPoint = this.canvasToScreen(canvasPoint);
			this.panX += screenPoint.x - newScreenPoint.x;
			this.panY += screenPoint.y - newScreenPoint.y;

			this.redraw();
		}
	}

	resetView() {
		this.panX = 0;
		this.panY = 0;
		this.zoom = 1;
		this.redraw();
	}

	startStroke(point: Point) {
		if (!this.context || this.currentTool.type === 'hand') return;

		if (this.currentTool.type === 'stroke_eraser') {
			this.deleteStrokesAtPoint(point);
			return;
		}

		const canvasPoint = this.screenToCanvas(point);

		this.rawPoints = [canvasPoint];

		this.isDrawing = true;
		this.currentStroke = {
			id: crypto.randomUUID(),
			points: [canvasPoint],
			color: this.currentColor,
			width: this.currentTool.size,
			tool: this.currentTool,
			sessionId: this.sessionId,
			timestamp: Date.now()
		};

		this.drawCurrentStroke();
	}

	addPoint(point: Point) {
		if (!this.isDrawing || !this.currentStroke || this.currentTool.type === 'hand') return;

		if (this.currentTool.type === 'stroke_eraser') {
			this.deleteStrokesAtPoint(point);
			return;
		}

		const canvasPoint = this.screenToCanvas(point);

		this.rawPoints.push(canvasPoint);

		if (settingsStore.drawing.smoothStrokes && this.rawPoints.length > 2) {
			const smoothed = this.smoothPoints(this.rawPoints);
			this.currentStroke.points = smoothed;
		} else {
			this.currentStroke.points.push(canvasPoint);
		}

		this.drawCurrentStroke();
	}

	endStroke() {
		if (!this.isDrawing || !this.currentStroke) return;

		if (settingsStore.drawing.smoothStrokes && this.rawPoints.length > 2) {
			let finalPoints = this.smoothPoints(this.rawPoints);
			finalPoints = this.interpolatePoints(finalPoints);

			if (finalPoints.length > 5) {
				finalPoints = this.applyBezierSmoothing(finalPoints);
			}

			this.currentStroke.points = finalPoints;
		}

		this.isDrawing = false;
		this.strokes.push(this.currentStroke);
		this.addToHistory();

		this.drawStroke(this.currentStroke);

		const event: DrawingEvent = {
			id: crypto.randomUUID(),
			boardId: this.currentBoardId || 'unknown',
			sessionId: this.sessionId,
			type: 'stroke',
			data: this.currentStroke,
			timestamp: Date.now(),
			sequence: this.eventSequence++
		};

		this.emitDrawingEvent(event);

		this.currentStroke = null;
		this.rawPoints = [];
	}

	updateCursor(point: Point) {
		if (this.currentTool.type === 'stroke_eraser') {
			const newHighlighted = this.getStrokesAtPoint(point);
			this.highlightedStrokes = newHighlighted;
			this.redraw();
		} else {
			if (this.highlightedStrokes.size > 0) {
				this.highlightedStrokes.clear();
				this.redraw();
			}
		}
	}

	private deleteStrokesAtPoint(point: Point) {
		const strokeIds = this.getStrokesAtPoint(point);
		if (strokeIds.size > 0) {
			const deletedStrokes = this.strokes.filter((stroke) => strokeIds.has(stroke.id));
			this.strokes = this.strokes.filter((stroke) => !strokeIds.has(stroke.id));
			this.addToHistory();
			this.redraw();

			this.emitDrawingEvent({
				id: crypto.randomUUID(),
				boardId: this.currentBoardId || 'unknown',
				sessionId: this.sessionId,
				type: 'stroke_deleted',
				data: { strokeIds: Array.from(strokeIds) },
				timestamp: Date.now(),
				sequence: this.eventSequence++
			});
		}
	}

	private getStrokesAtPoint(point: Point): Set<string> {
		const canvasPoint = this.screenToCanvas(point);
		const eraserRadius = this.currentTool.size;
		const foundStrokes = new Set<string>();

		for (const stroke of this.strokes) {
			if (this.strokeIntersectsPoint(stroke, canvasPoint, eraserRadius)) {
				foundStrokes.add(stroke.id);
			}
		}

		return foundStrokes;
	}

	private strokeIntersectsPoint(stroke: DrawingStroke, point: Point, radius: number): boolean {
		const strokeRadius = stroke.width / 2;
		const totalRadius = radius + strokeRadius;

		for (let i = 0; i < stroke.points.length; i++) {
			const strokePoint = stroke.points[i];
			const distance = Math.sqrt(
				Math.pow(strokePoint.x - point.x, 2) + Math.pow(strokePoint.y - point.y, 2)
			);

			if (distance <= totalRadius) {
				return true;
			}

			if (i > 0) {
				const prevPoint = stroke.points[i - 1];
				const distanceToLine = this.pointToLineDistance(point, prevPoint, strokePoint);
				if (distanceToLine <= totalRadius) {
					return true;
				}
			}
		}

		return false;
	}

	private pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
		const A = point.x - lineStart.x;
		const B = point.y - lineStart.y;
		const C = lineEnd.x - lineStart.x;
		const D = lineEnd.y - lineStart.y;

		const dot = A * C + B * D;
		const lenSq = C * C + D * D;
		let param = -1;

		if (lenSq !== 0) {
			param = dot / lenSq;
		}

		let xx, yy;

		if (param < 0) {
			xx = lineStart.x;
			yy = lineStart.y;
		} else if (param > 1) {
			xx = lineEnd.x;
			yy = lineEnd.y;
		} else {
			xx = lineStart.x + param * C;
			yy = lineStart.y + param * D;
		}

		const dx = point.x - xx;
		const dy = point.y - yy;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private drawStroke(stroke: DrawingStroke, isHighlighted: boolean = false) {
		if (!this.context || stroke.points.length === 0) return;

		this.context.save();
		this.context.strokeStyle = isHighlighted ? '#ff0000' : stroke.color;
		this.context.lineWidth = stroke.width * this.zoom;
		this.context.lineCap = 'round';
		this.context.lineJoin = 'round';
		this.context.globalAlpha = isHighlighted ? 0.5 : stroke.tool.opacity;

		if (stroke.tool.type === 'eraser') {
			this.context.globalCompositeOperation = 'destination-out';
		} else if (stroke.tool.type === 'highlighter') {
			this.context.globalCompositeOperation = 'multiply';
			this.context.fillStyle = isHighlighted ? '#ff0000' : stroke.color;
		} else {
			this.context.globalCompositeOperation = 'source-over';
		}

		const screenPoints = stroke.points.map((p) => this.canvasToScreen(p));

		if (screenPoints.length === 1) {
			const point = screenPoints[0];
			this.context.beginPath();
			this.context.arc(point.x, point.y, (stroke.width * this.zoom) / 2, 0, 2 * Math.PI);
			this.context.fill();
		} else {
			this.context.beginPath();
			this.context.moveTo(screenPoints[0].x, screenPoints[0].y);

			if (settingsStore.drawing.smoothStrokes && screenPoints.length > 2) {
				for (let i = 1; i < screenPoints.length - 1; i++) {
					const current = screenPoints[i];
					const next = screenPoints[i + 1];

					const midX = (current.x + next.x) / 2;
					const midY = (current.y + next.y) / 2;

					this.context.quadraticCurveTo(current.x, current.y, midX, midY);
				}

				if (screenPoints.length > 1) {
					const lastPoint = screenPoints[screenPoints.length - 1];
					this.context.lineTo(lastPoint.x, lastPoint.y);
				}
			} else {
				for (let i = 1; i < screenPoints.length; i++) {
					this.context.lineTo(screenPoints[i].x, screenPoints[i].y);
				}
			}

			this.context.stroke();
		}

		this.context.restore();
	}

	redraw() {
		if (!this.context || !this.canvas) return;

		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for (const stroke of this.strokes) {
			const isHighlighted = this.highlightedStrokes.has(stroke.id);
			this.drawStroke(stroke, isHighlighted);
		}

		if (this.isDrawing && this.currentStroke) {
			this.drawStroke(this.currentStroke);
		}
	}

	private addToHistory() {
		this.history = this.history.slice(0, this.historyIndex + 1);

		this.history.push([...this.strokes]);
		this.historyIndex++;

		if (this.history.length > 50) {
			this.history.shift();
			this.historyIndex--;
		}
	}

	undo() {
		if (this.historyIndex > 0) {
			const previousStrokes = [...this.history[this.historyIndex]];
			this.historyIndex--;
			const newStrokes = [...this.history[this.historyIndex]];

			const removedStrokes = previousStrokes.slice(newStrokes.length);

			this.strokes = newStrokes;
			this.redraw();

			this.emitDrawingEvent({
				id: crypto.randomUUID(),
				boardId: this.currentBoardId || 'unknown',
				sessionId: this.sessionId,
				type: 'undo',
				data: { historyIndex: this.historyIndex, removedStrokes },
				timestamp: Date.now(),
				sequence: this.eventSequence++
			});
		}
	}

	redo() {
		if (this.historyIndex < this.history.length - 1) {
			this.historyIndex++;
			const newStrokes = [...this.history[this.historyIndex]];
			const previousStrokes = this.historyIndex > 0 ? this.history[this.historyIndex - 1] : [];

			const redoStrokes = newStrokes.slice(previousStrokes.length);

			this.strokes = newStrokes;
			this.redraw();

			this.emitDrawingEvent({
				id: crypto.randomUUID(),
				boardId: this.currentBoardId || 'unknown',
				sessionId: this.sessionId,
				type: 'redo',
				data: { strokes: redoStrokes },
				timestamp: Date.now(),
				sequence: this.eventSequence++
			});
		}
	}

	clear() {
		this.strokes = [];
		this.redraw();
		this.addToHistory();

		this.emitDrawingEvent({
			id: crypto.randomUUID(),
			boardId: this.currentBoardId || 'unknown',
			sessionId: this.sessionId,
			type: 'clear',
			data: {},
			timestamp: Date.now(),
			sequence: this.eventSequence++
		});
	}

	handleDrawingEvent(event: DrawingEvent) {
		if (event.sessionId === this.sessionId) return;

		switch (event.type) {
			case 'stroke':
				if (event.data && typeof event.data === 'object' && 'points' in event.data) {
					this.strokes.push(event.data as DrawingStroke);
					this.drawStroke(event.data as DrawingStroke);
					this.addToHistory();
				}
				break;
			case 'stroke_deleted':
				if (event.data && typeof event.data === 'object' && 'strokeIds' in event.data) {
					const strokeIds = event.data.strokeIds as string[];
					this.strokes = this.strokes.filter((stroke) => !strokeIds.includes(stroke.id));
					this.redraw();
					this.addToHistory();
				}
				break;
			case 'clear':
				this.strokes = [];
				this.redraw();
				this.addToHistory();
				break;
			case 'undo':
				if (this.strokes.length > 0) {
					this.strokes.pop();
					this.redraw();
					this.addToHistory();
				}
				break;
			case 'redo':
				if (event.data && typeof event.data === 'object' && 'strokes' in event.data) {
					const redoStrokes = event.data.strokes as DrawingStroke[];
					for (const stroke of redoStrokes) {
						this.strokes.push(stroke);
						this.drawStroke(stroke);
					}
					this.addToHistory();
				}
				break;
		}
	}

	handleSyncEvents(events: any[]) {
		this.strokes = [];

		const sortedEvents = events.sort((a, b) => a.sequence - b.sequence);

		for (const event of sortedEvents) {
			switch (event.type) {
				case 'stroke':
					if (event.data && typeof event.data === 'object' && 'points' in event.data) {
						this.strokes.push(event.data as DrawingStroke);
					}
					break;
				case 'stroke_deleted':
					if (event.data && typeof event.data === 'object' && 'strokeIds' in event.data) {
						const strokeIds = event.data.strokeIds as string[];
						this.strokes = this.strokes.filter((stroke) => !strokeIds.includes(stroke.id));
					}
					break;
				case 'clear':
					this.strokes = [];
					break;
				case 'undo':
					if (this.strokes.length > 0) {
						this.strokes.pop();
					}
					break;
				case 'redo':
					if (event.data && typeof event.data === 'object' && 'strokes' in event.data) {
						const redoStrokes = event.data.strokes as DrawingStroke[];
						for (const stroke of redoStrokes) {
							this.strokes.push(stroke);
						}
					}
					break;
			}
		}

		this.redraw();
		this.addToHistory();

		if (events.length > 0) {
			const maxSequence = Math.max(...events.map((e) => e.sequence));
			this.eventSequence = maxSequence + 1;
		}
	}

	private emitDrawingEvent(event: DrawingEvent) {
		if (this.sendDrawingEvent) {
			this.sendDrawingEvent(event);
		}
	}

	setTool(tool: DrawingTool) {
		this.currentTool = tool;
	}

	setColor(color: string) {
		this.currentColor = color;
	}

	private drawCurrentStroke() {
		if (!this.context || !this.currentStroke || this.currentStroke.points.length === 0) return;

		if (this.currentStroke.tool.type === 'highlighter') {
			this.redraw();
		} else {
			this.drawStroke(this.currentStroke);
		}
	}

	exportCanvasAsImage(filename: string = 'canvas'): void {
		if (!this.canvas) {
			console.error('Canvas not available for export');
			return;
		}

		try {
			const tempCanvas = document.createElement('canvas');
			const tempCtx = tempCanvas.getContext('2d');

			if (!tempCtx) {
				console.error('Failed to get temporary canvas context');
				return;
			}

			tempCanvas.width = this.canvas.width;
			tempCanvas.height = this.canvas.height;

			const rootStyles = getComputedStyle(document.documentElement);
			const backgroundColorRGB = rootStyles
				.getPropertyValue('--m3-scheme-surface-container-high')
				.trim();
			const backgroundColor = backgroundColorRGB ? `rgb(${backgroundColorRGB})` : '#ffffff';

			tempCtx.fillStyle = backgroundColor;
			tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

			tempCtx.drawImage(this.canvas, 0, 0);

			tempCanvas.toBlob(
				(blob) => {
					if (!blob) {
						console.error('Failed to create image blob');
						return;
					}

					const url = URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `${filename}.jpg`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
				},
				'image/jpeg',
				0.9
			);
		} catch (error) {
			console.error('Failed to export canvas as image:', error);
		}
	}
}

export const drawingStore = new DrawingStore();
