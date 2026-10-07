import { useState, useEffect, useRef, useCallback } from 'react';
import { Trade, PullState, WebSocketMessage } from '../types.js';
import { fetchInitialTrades, triggerPull } from '../services/api.js';

export function useTradeWebSocket() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pullState, setPullState] = useState<PullState>({
    status: 'idle',
    lastPullTime: null,
    startedAt: null,
    durationMs: null,
    error: null,
    tradesAddedLastPull: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadInitialData() {
      try {
        const data = await fetchInitialTrades();
        if (isMountedRef.current) {
          setTrades(data.trades);
          setTotalCount(data.totalCount);
          if (data.pullState) {
            setPullState(data.pullState);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadInitialData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!isMountedRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'INITIAL_STATE': {
            setTrades(message.trades);
            setTotalCount(message.totalCount);
            setPullState(message.pullState);
            break;
          }

          case 'PULL_STATUS': {
            setPullState((prev) => ({
              ...prev,
              status: message.status,
              startedAt: message.startedAt || prev.startedAt,
              error: null,
            }));
            break;
          }

          case 'TRADES_UPDATED': {
            setTrades((prevTrades) => {
              const existingIds = new Set(prevTrades.map((t) => t.tradeId));
              const filteredNew = message.trades.filter((t) => !existingIds.has(t.tradeId));
              return [...filteredNew, ...prevTrades];
            });

            setTotalCount(message.totalCount);

            setPullState((prev) => ({
              ...prev,
              status: 'completed',
              lastPullTime: message.timestamp,
              tradesAddedLastPull: message.batchSize,
              error: null,
            }));
            break;
          }

          case 'PULL_FAILED': {
            setPullState((prev) => ({
              ...prev,
              status: 'failed',
              error: message.message,
            }));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      wsRef.current = null;

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  const startPull = useCallback(async (options?: { delayMs?: number; fail?: boolean }) => {
    try {
      setPullState((prev) => ({
        ...prev,
        status: 'pulling',
        startedAt: new Date().toISOString(),
        error: null,
      }));

      const result = await triggerPull(options);
      return result;
    } catch (err: any) {
      setPullState((prev) => ({
        ...prev,
        status: 'failed',
        error: err.message,
      }));
      throw err;
    }
  }, []);

  return {
    trades,
    totalCount,
    pullState,
    startPull,
  };
}
