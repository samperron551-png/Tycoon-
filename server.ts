import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('tycoon.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    username TEXT,
    state TEXT,
    total_earned REAL DEFAULT 0,
    prestige_level INTEGER DEFAULT 0
  )
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // WebSocket handling
  const clients = new Map<WebSocket, string>();

  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Handle messages (SYNC_STATE, etc.)
        if (message.type === 'SYNC_STATE') {
          // In a real app, we'd authenticate and use a real user ID
          const userId = message.username || 'guest-1'; 
          db.prepare('INSERT OR REPLACE INTO players (id, username, state, total_earned, prestige_level) VALUES (?, ?, ?, ?, ?)')
            .run(userId, userId, JSON.stringify(message.state), message.state.totalEarned, message.state.prestigeLevel);
          
          // Broadcast leaderboard
          broadcastLeaderboard();
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send initial leaderboard
    sendLeaderboard(ws);
  });

  function broadcastLeaderboard() {
    const leaderboard = db.prepare('SELECT username, total_earned as totalEarned, prestige_level as prestigeLevel FROM players ORDER BY total_earned DESC LIMIT 10').all();
    const msg = JSON.stringify({ type: 'LEADERBOARD_UPDATE', leaderboard });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  function sendLeaderboard(ws: WebSocket) {
    const leaderboard = db.prepare('SELECT username, total_earned as totalEarned, prestige_level as prestigeLevel FROM players ORDER BY total_earned DESC LIMIT 10').all();
    ws.send(JSON.stringify({ type: 'LEADERBOARD_UPDATE', leaderboard }));
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
