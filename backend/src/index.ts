import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { registerSocketHandlers } from './socket';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

app.use(express.json());

// Log paths for debugging
console.log('Current directory:', __dirname);
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
console.log('Looking for frontend dist at:', frontendDistPath);

// Serve static files
app.use(express.static(frontendDistPath));

// Catch-all route for frontend routing
app.get('/*path', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});