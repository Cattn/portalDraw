import type { DrawingEvent, DrawingStroke, DrawingTool, Point } from '$lib/types';

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
	
	private history = $state<DrawingStroke[][]>([]);
	private historyIndex = $state(-1);
	
	private eventSequence = $state(0);
	
	sessionId = $state(crypto.randomUUID());
	sessionColor = $state(this.generateRandomColor());
	
	canvas = $state<HTMLCanvasElement | null>(null);
	context = $state<CanvasRenderingContext2D | null>(null);
	
	// Current board ID
	currentBoardId = $state<string | null>(null);
	
	// Websocket send function - will be set by the websocket store
	private sendDrawingEvent: ((event: DrawingEvent) => void) | null = null;
	private requestSyncEvent: ((boardId: string) => void) | null = null;
	
	private generateRandomColor(): string {
		const colors = [
			'#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
			'#9b59b6', '#1abc9c', '#e67e22', '#34495e'
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}
	
	initCanvas(canvasElement: HTMLCanvasElement) {
		this.canvas = canvasElement;
		this.context = canvasElement.getContext('2d');
		// Remove grid drawing since we're using CSS background
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
	
	startStroke(point: Point) {
		if (!this.context) return;
		
		this.isDrawing = true;
		this.currentStroke = {
			id: crypto.randomUUID(),
			points: [point],
			color: this.currentColor,
			width: this.currentTool.size,
			tool: this.currentTool,
			sessionId: this.sessionId,
			timestamp: Date.now()
		};
		
		// Draw the initial point immediately
		this.drawCurrentStroke();
	}
	
	addPoint(point: Point) {
		if (!this.isDrawing || !this.currentStroke) return;
		
		this.currentStroke.points.push(point);
		
		// Draw the current stroke in real-time
		this.drawCurrentStroke();
	}
	
	endStroke() {
		if (!this.isDrawing || !this.currentStroke) return;
		
		this.isDrawing = false;
		this.strokes.push(this.currentStroke);
		this.addToHistory();
		
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
	}
	
	private drawStroke(stroke: DrawingStroke) {
		if (!this.context || stroke.points.length === 0) return;
		
		this.context.save();
		this.context.strokeStyle = stroke.color;
		this.context.lineWidth = stroke.width;
		this.context.lineCap = 'round';
		this.context.lineJoin = 'round';
		this.context.globalAlpha = stroke.tool.opacity;
		
		if (stroke.tool.type === 'eraser') {
			this.context.globalCompositeOperation = 'destination-out';
		} else {
			this.context.globalCompositeOperation = 'source-over';
		}
		
		// Handle single point as a dot
		if (stroke.points.length === 1) {
			const point = stroke.points[0];
			this.context.beginPath();
			this.context.arc(point.x, point.y, stroke.width / 2, 0, 2 * Math.PI);
			this.context.fill();
		} else {
			// Draw line for multiple points
			this.context.beginPath();
			this.context.moveTo(stroke.points[0].x, stroke.points[0].y);
			
			for (let i = 1; i < stroke.points.length; i++) {
				this.context.lineTo(stroke.points[i].x, stroke.points[i].y);
			}
			
			this.context.stroke();
		}
		
		this.context.restore();
	}
	
	redraw() {
		if (!this.context || !this.canvas) return;
		
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		// Grid is now handled by CSS background
		
		for (const stroke of this.strokes) {
			this.drawStroke(stroke);
		}
		
		// Redraw current stroke if we're actively drawing
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
			
			// Find the stroke(s) that were removed by the undo
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
			
			// Find the stroke(s) that were added back by the redo
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
			case 'clear':
				this.strokes = [];
				this.redraw();
				this.addToHistory();
				break;
			case 'undo':
				// For undo from other users, remove the last stroke
				if (this.strokes.length > 0) {
					this.strokes.pop();
					this.redraw();
					this.addToHistory();
				}
				break;
			case 'redo':
				// For redo from other users, add back the strokes
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
		
		// Clear current strokes and rebuild from events
		this.strokes = [];
		
		// Sort events by sequence to ensure proper order
		const sortedEvents = events.sort((a, b) => a.sequence - b.sequence);
		
		// Process all events in order to rebuild the canvas state
		for (const event of sortedEvents) {
			switch (event.type) {
				case 'stroke':
					if (event.data && typeof event.data === 'object' && 'points' in event.data) {
						this.strokes.push(event.data as DrawingStroke);
					}
					break;
				case 'clear':
					// Clear all strokes up to this point
					this.strokes = [];
					break;
				case 'undo':
					// Remove the last stroke
					if (this.strokes.length > 0) {
						this.strokes.pop();
					}
					break;
				case 'redo':
					// Add back the strokes that were redone
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
		
		// Update sequence number to be higher than any received
		if (events.length > 0) {
			const maxSequence = Math.max(...events.map(e => e.sequence));
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
	
	// New method to draw only the current stroke being drawn
	private drawCurrentStroke() {
		if (!this.context || !this.currentStroke || this.currentStroke.points.length === 0) return;
		
		// Simply draw the entire current stroke - this will show real-time progress
		this.drawStroke(this.currentStroke);
	}
	
	private requestSync() {
		// Request a full sync of all events from the server
		if (this.requestSyncEvent && this.currentBoardId) {
			this.requestSyncEvent(this.currentBoardId);
		}
	}
}

export const drawingStore = new DrawingStore(); 