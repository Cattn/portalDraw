import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../database';
import type { Board } from '../types';

export function createBoardsRouter(db: Database): Router {
	const router = Router();

	router.get('/', async (req: any, res: any) => {
		try {
			const boards = await db.getBoards();
			res.json(boards);
		} catch (error) {
			console.error('Error fetching boards:', error);
			res.status(500).json({ error: 'Failed to fetch boards' });
		}
	});

	router.post('/', async (req: any, res: any) => {
		try {
			const { name, description, is_public = true } = req.body;

			if (!name || typeof name !== 'string') {
				return res.status(400).json({ error: 'Board name is required' });
			}

			const boardData = {
				id: uuidv4(),
				name: name.trim(),
				description: description?.trim() || '',
				drawing_data: '[]',
				is_public: Boolean(is_public)
			};

			const board = await db.createBoard(boardData);
			res.status(201).json(board);
		} catch (error) {
			console.error('Error creating board:', error);
			res.status(500).json({ error: 'Failed to create board' });
		}
	});

	router.get('/:id', async (req: any, res: any) => {
		try {
			const { id } = req.params;
			const board = await db.getBoardById(id);

			if (!board) {
				return res.status(404).json({ error: 'Board not found' });
			}

			res.json(board);
		} catch (error) {
			console.error('Error fetching board:', error);
			res.status(500).json({ error: 'Failed to fetch board' });
		}
	});

	router.put('/:id', async (req: any, res: any) => {
		try {
			const { id } = req.params;
			const updates = req.body;

			const existingBoard = await db.getBoardById(id);
			if (!existingBoard) {
				return res.status(404).json({ error: 'Board not found' });
			}

			const allowedFields = ['name', 'description', 'drawing_data', 'is_public'];
			const filteredUpdates: any = {};

			for (const field of allowedFields) {
				if (field in updates) {
					filteredUpdates[field] = updates[field];
				}
			}

			await db.updateBoard(id, filteredUpdates);

			const updatedBoard = await db.getBoardById(id);
			res.json(updatedBoard);
		} catch (error) {
			console.error('Error updating board:', error);
			res.status(500).json({ error: 'Failed to update board' });
		}
	});

	router.delete('/:id', async (req: any, res: any) => {
		try {
			const { id } = req.params;

			const existingBoard = await db.getBoardById(id);
			if (!existingBoard) {
				return res.status(404).json({ error: 'Board not found' });
			}

			await db.deleteBoard(id);
			res.status(204).send();
		} catch (error) {
			console.error('Error deleting board:', error);
			res.status(500).json({ error: 'Failed to delete board' });
		}
	});

	router.get('/:id/events', async (req: any, res: any) => {
		try {
			const { id } = req.params;
			const { fromSequence } = req.query;

			const board = await db.getBoardById(id);
			if (!board) {
				return res.status(404).json({ error: 'Board not found' });
			}

			const sequence = fromSequence ? parseInt(String(fromSequence), 10) : undefined;
			const events = await db.getDrawingEvents(id, sequence);

			res.json(events);
		} catch (error) {
			console.error('Error fetching drawing events:', error);
			res.status(500).json({ error: 'Failed to fetch drawing events' });
		}
	});

	router.get('/:id/sessions', async (req: any, res: any) => {
		try {
			const { id } = req.params;

			const board = await db.getBoardById(id);
			if (!board) {
				return res.status(404).json({ error: 'Board not found' });
			}

			const sessions = await db.getActiveSessions(id);
			res.json(sessions);
		} catch (error) {
			console.error('Error fetching board sessions:', error);
			res.status(500).json({ error: 'Failed to fetch board sessions' });
		}
	});

	return router;
}
