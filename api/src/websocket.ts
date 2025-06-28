import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import type { Database } from './database';
import type { WebSocketMessage, DrawingEvent, Point, BoardSession } from './types';
import { config } from './config';

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
	transports: [new winston.transports.Console()]
});

export class WebSocketHandler {
	private io: SocketIOServer;
	private db: Database;
	private activeSessions = new Map<string, BoardSession>();

	constructor(server: HttpServer, db: Database) {
		this.db = db;
		this.io = new SocketIOServer(server, {
			cors: config.websocket.cors
		});

		logger.info('WebSocket server initialized with CORS:', config.websocket.cors);
		this.setupEventHandlers();
	}

	private setupEventHandlers(): void {
		this.io.on('connection', (socket) => {
			logger.info(`Client connected: ${socket.id}`);

			socket.on('join_board', async (data: { boardId: string; sessionColor?: string }) => {
				try {
					const { boardId, sessionColor = this.generateRandomColor() } = data;

					const board = await this.db.getBoardById(boardId);
					if (!board) {
						socket.emit('error', { message: 'Board not found' });
						return;
					}

					socket.join(boardId);

					const sessionId = uuidv4();
					const session = await this.db.createSession({
						id: sessionId,
						boardId,
						socketId: socket.id,
						sessionColor
					});

					this.activeSessions.set(socket.id, session);

					socket.emit('session_joined', {
						sessionId,
						sessionColor,
						boardId
					});

					socket.to(boardId).emit('collaborator_joined', {
						sessionId,
						sessionColor
					});

					const events = await this.db.getDrawingEvents(boardId);
					socket.emit('sync_events', events);

					logger.info(`Session ${sessionId} joined board ${boardId}`);
				} catch (error) {
					logger.error('Error joining board:', error);
					socket.emit('error', { message: 'Failed to join board' });
				}
			});

			socket.on('drawing_event', async (drawingEvent: DrawingEvent) => {
				try {
					logger.info('Received drawing_event:', JSON.stringify(drawingEvent));

					const session = this.activeSessions.get(socket.id);
					if (!session) {
						logger.warn('No active session for socket:', socket.id);
						socket.emit('error', { message: 'No active session' });
						return;
					}

					const event: DrawingEvent = {
						id: uuidv4(),
						boardId: session.boardId,
						sessionId: session.id,
						type: drawingEvent.type,
						data: drawingEvent.data,
						timestamp: Date.now(),
						sequence: await this.getNextSequenceNumber(session.boardId)
					};

					logger.info('Saving drawing event to database:', JSON.stringify(event));

					await this.db.saveDrawingEvent(event);

					logger.info('Broadcasting event to other clients in board:', session.boardId);

					socket.to(session.boardId).emit('drawing_event', event);

					await this.db.updateSessionActivity(session.id);
				} catch (error) {
					logger.error('Error handling drawing event:', error);
					socket.emit('error', { message: 'Failed to process drawing event' });
				}
			});

			socket.on('cursor_move', async (data: { x: number; y: number }) => {
				try {
					const session = this.activeSessions.get(socket.id);
					if (!session) return;

					const cursor: Point = { x: data.x, y: data.y };

					await this.db.updateSessionActivity(session.id, cursor);

					socket.to(session.boardId).emit('cursor_move', {
						sessionId: session.id,
						sessionColor: session.sessionColor,
						cursor
					});
				} catch (error) {
					logger.error('Error handling cursor move:', error);
				}
			});

			socket.on('sync_request', async (data: { boardId: string; fromSequence?: number }) => {
				try {
					const { boardId, fromSequence } = data;
					const events = await this.db.getDrawingEvents(boardId, fromSequence);
					socket.emit('sync_events', events);
				} catch (error) {
					logger.error('Error handling sync request:', error);
					socket.emit('error', { message: 'Failed to sync events' });
				}
			});

			socket.on('disconnect', async () => {
				try {
					const session = this.activeSessions.get(socket.id);
					if (session) {
						await this.db.removeSession(session.id);

						socket.to(session.boardId).emit('collaborator_left', {
							sessionId: session.id
						});

						this.activeSessions.delete(socket.id);
						logger.info(`Session ${session.id} disconnected from board ${session.boardId}`);
					}

					logger.info(`Client disconnected: ${socket.id}`);
				} catch (error) {
					logger.error('Error handling disconnect:', error);
				}
			});
		});
	}

	private async getNextSequenceNumber(boardId: string): Promise<number> {
		const events = await this.db.getDrawingEvents(boardId);
		return events.length > 0 ? Math.max(...events.map((e) => e.sequence)) + 1 : 1;
	}

	private generateRandomColor(): string {
		const colors = [
			'#FF6B6B',
			'#4ECDC4',
			'#45B7D1',
			'#96CEB4',
			'#FECA57',
			'#FF9FF3',
			'#54A0FF',
			'#5F27CD',
			'#00D2D3',
			'#FF9F43',
			'#10AC84',
			'#EE5A24',
			'#0984E3',
			'#6C5CE7',
			'#A29BFE'
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	public getIO(): SocketIOServer {
		return this.io;
	}
}
