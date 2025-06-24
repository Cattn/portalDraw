<h3 align="center">
    <strong>portalDraw</strong>
</h3>

### Showcases

<p align="center">
    <img src="https://github.com/Cattn/portalDraw/blob/main/static/showcase.png?raw=true">
</p>

A collaborative real-time drawing application built with SvelteKit and a separate TypeScript API server. This project prioritizes self-hostability & being private. It is recommended to use Tailscale, or some other wireguard setup to have users access the site on their devices, and not expose it to the internet..


## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. **Install dependencies for both frontend and API:**
 
```bash
npm i
```

```bash
cd api && npm install && cd ..
```

```bash
npm i -g concurrently
```

### Setting Environment Variables

Refer to ``.env.example`` for an example. Simply change the name to ``.env`` and change and variables you'd like. If you choose not to modify any values, everything shown in .env.example will be the default.

**Need multiple origins for CORS? (Tailscale)**

Modify your .env to include multiple origins, seperated by ``,``
```bash
CORS_ORIGIN=url1,url2,url3
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
npm run dev:api
```
```bash
npm run dev:frontend
```

### Production Build

```bash
npm run build
```
```bash
npm start
```

> The frontend will start on :5024 for production builds. Please update your .env file if you plan on running the server in production mode.

## Notes & Disclaimers

### Logs
Server logs are automatically saved to api.log in ``/api``.

### AI Assistance
This project was created with assistance from AI. It was NOT the majority product of AI, and it was simply used as a tool

### Public Demo
There will be a public demo available for this application, but it will not always be up due to server load & resource management. I host many things on my server, and this application is primarly meant to be self-hosted, and used among friends/family.

### Config
The config for this application is GLOBAL. This means that anyone with access to the application can change settings. If you do not want this behavior, please change ``globalSettings`` in ``src/lib/stores/settings.svelte.ts`` to ``false``. Please note that if you choose to disable thigs, some settings may not work as expected.

## Contributors
[Cattn](https://github.com/cattn)