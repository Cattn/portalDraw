# PortalDraw

A collaborative real-time drawing application built with SvelteKit and a separate TypeScript API server.

## Architecture

This project uses a **decoupled architecture** with:

- **Frontend**: SvelteKit application with adapter-node
- **Backend**: Standalone TypeScript API server with Express.js and Socket.IO
- **Database**: SQLite with automatic migrations
- **Real-time**: Socket.IO for collaborative features

## Project Structure

```
portalDraw/
├── api/                    # TypeScript API server
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── database.ts    # Database service
│   │   ├── websocket.ts   # Socket.IO handler
│   │   ├── routes/        # API routes
│   │   └── migrations/    # Database migrations
│   ├── package.json
│   └── README.md
├── src/                   # SvelteKit frontend
│   ├── lib/
│   │   ├── components/    # Svelte components
│   │   ├── services/      # API services
│   │   ├── stores/        # Svelte stores
│   │   └── types.ts       # TypeScript types
│   └── routes/            # SvelteKit routes
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. **Install dependencies for both frontend and API:**

```bash
npm install
cd api && npm install && cd ..
```

2. **Set up environment variables:**

```bash
cd api
cp .env.example .env
# Edit .env as needed
cd ..
```

### Development

**Start both API and frontend servers:**

```bash
npm run dev
```

This will start:
- API server on http://localhost:3001
- Frontend on http://localhost:5173

**Or run them separately:**

```bash
# Terminal 1 - API server
npm run dev:api

# Terminal 2 - Frontend
npm run dev:frontend
```

### Production Build

```bash
npm run build
npm start
```

## Features

- **Real-time collaboration** - Multiple users can draw simultaneously
- **Drawing tools** - Pen, eraser, highlighter with customizable sizes
- **Board management** - Create, update, and manage drawing boards
- **Session management** - Track active users and their cursors
- **Auto-save** - All drawing events are automatically saved
- **Cross-platform** - Works on desktop and mobile browsers

## API Documentation

See [api/README.md](api/README.md) for detailed API documentation.

## Technology Stack

### Frontend
- SvelteKit with adapter-node
- TypeScript
- Tailwind CSS
- Material Design 3 (m3-svelte)
- Socket.IO client

### Backend
- Node.js with TypeScript
- Express.js
- Socket.IO
- SQLite
- Winston (logging)

## Deployment

The application can be deployed as:

1. **Standalone servers** - Deploy API and frontend separately
2. **Combined deployment** - Use the production start script to run both

For production, consider:
- Using a reverse proxy (nginx) for SSL and load balancing
- Setting up proper environment variables
- Configuring database backups
- Setting up monitoring and logging

## Migration Complete

✅ **Server functions migrated to standalone API**
✅ **TypeScript API server with Express.js and Socket.IO**
✅ **SvelteKit configured with adapter-node**
✅ **Database migrations moved to API server**
✅ **WebSocket functionality migrated to Socket.IO**
✅ **Frontend updated to consume external API**
