import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from '../types/trade.js';
import { tradeStore } from '../services/tradeStore.js';

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public init(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      const initialState: WebSocketMessage = {
        type: 'INITIAL_STATE',
        trades: tradeStore.getAllTrades(),
        totalCount: tradeStore.getTotalCount(),
        pullState: tradeStore.getPullState(),
      };

      try {
        ws.send(JSON.stringify(initialState));
      } catch (err) {
        console.error(err);
      }

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch {
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  public broadcast(message: WebSocketMessage): void {
    if (this.clients.size === 0) {
      return;
    }

    const payload = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
}

export const wsManager = new WebSocketManager();
