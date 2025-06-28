import dotenv from 'dotenv';
import { handler } from './build/handler.js';
import express from 'express';

// Load environment variables
dotenv.config();

const app = express();

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(5024, () => {
	console.log('listening on port 5024');
});
