import { Trade, PullState } from '../types/trade.js';
import { createInitialSeededTrades } from '../data/seedTrades.js';

class TradeStore {
  private trades: Trade[] = [];
  private pullState: PullState = {
    status: 'idle',
    lastPullTime: null,
    startedAt: null,
    durationMs: null,
    error: null,
    tradesAddedLastPull: 0,
  };

  constructor() {
    this.initialize();
  }

  public initialize(): void {
    this.trades = createInitialSeededTrades();
    this.pullState = {
      status: 'idle',
      lastPullTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      startedAt: null,
      durationMs: null,
      error: null,
      tradesAddedLastPull: 0,
    };
  }

  public getAllTrades(): Trade[] {
    return this.trades;
  }

  public getTotalCount(): number {
    return this.trades.length;
  }

  public addTrades(newTrades: Trade[]): { addedCount: number; newTrades: Trade[] } {
    const existingIds = new Set(this.trades.map((t) => t.tradeId));
    const uniqueNewTrades = newTrades.filter((t) => !existingIds.has(t.tradeId));

    this.trades = [...uniqueNewTrades, ...this.trades];
    this.pullState.tradesAddedLastPull = uniqueNewTrades.length;

    return {
      addedCount: uniqueNewTrades.length,
      newTrades: uniqueNewTrades,
    };
  }

  public getPullState(): PullState {
    return { ...this.pullState };
  }

  public setPullState(update: Partial<PullState>): void {
    this.pullState = {
      ...this.pullState,
      ...update,
    };
  }

  public isPulling(): boolean {
    return this.pullState.status === 'pulling';
  }
}

export const tradeStore = new TradeStore();
