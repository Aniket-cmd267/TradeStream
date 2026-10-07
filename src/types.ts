export interface Trade {
  tradeId: string;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
}

export type PullStatus = 'idle' | 'pulling' | 'completed' | 'failed';

export interface PullState {
  status: PullStatus;
  lastPullTime: string | null;
  startedAt: string | null;
  durationMs: number | null;
  error: string | null;
  tradesAddedLastPull: number;
}

export type WebSocketMessage =
  | {
      type: 'TRADES_UPDATED';
      trades: Trade[];
      totalCount: number;
      timestamp: string;
      batchSize: number;
    }
  | {
      type: 'PULL_STATUS';
      status: PullStatus;
      message?: string;
      startedAt?: string;
      configuredDelayMs?: number;
    }
  | {
      type: 'PULL_FAILED';
      message: string;
      timestamp: string;
    }
  | {
      type: 'INITIAL_STATE';
      trades: Trade[];
      totalCount: number;
      pullState: PullState;
    };
