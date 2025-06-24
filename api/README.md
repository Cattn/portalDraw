# PortalDraw API Server

A TypeScript-based API server for the PortalDraw collaborative drawing application using Express.js, Socket.IO, and SQLite.

## Features

- **RESTful API** for board management
- **Real-time collaboration** via Socket.IO
- **SQLite database** with automatic migrations
- **TypeScript** for type safety
- **Winston logging** for debugging and monitoring
- **CORS support** for cross-origin requests

## Getting Started

### Installation

```bash
cd api
npm install
```

### Environment Variables

Copy the example environment file and update as needed:

```bash
cp .env.example .env
```

Available environment variables:
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: localhost)
- `DB_PATH` - SQLite database file path (default: portaldraw.sqlite)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)

### Development

```bash
npm run dev
```

This starts the server with hot-reload using nodemon and ts-node.

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Boards

- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get a specific board
- `PUT /api/boards/:id` - Update a board
- `GET /api/boards/:id/events` - Get drawing events for a board
- `GET /api/boards/:id/sessions` - Get active sessions for a board

### Health Check

- `GET /health` - Server health check

## WebSocket Events

### Client to Server

- `join_board` - Join a drawing board
- `drawing_event` - Send a drawing event
- `cursor_move` - Update cursor position
- `sync_request` - Request event synchronization

### Server to Client

- `session_joined` - Successful board join
- `collaborator_joined` - New collaborator joined
- `collaborator_left` - Collaborator left
- `drawing_event` - Broadcast drawing event
- `cursor_move` - Broadcast cursor movement
- `sync_events` - Event synchronization data
- `error` - Error messages

## Database Schema

The API automatically runs migrations on startup to create the required tables:

- `boards` - Drawing boards
- `drawing_events` - Drawing operations and events
- `board_sessions` - Active user sessions

## Architecture

```
api/
├── src/
│   ├── config.ts          # Configuration and environment variables
│   ├── database.ts        # Database service and operations
│   ├── index.ts           # Main server entry point
│   ├── types.ts           # TypeScript type definitions
│   ├── websocket.ts       # Socket.IO handler
│   ├── migrations/        # Database migration files
│   └── routes/
│       └── boards.ts      # Board API routes
├── dist/                  # Compiled JavaScript (created after build)
├── package.json
├── tsconfig.json
└── README.md
``` 