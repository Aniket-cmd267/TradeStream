import { tradeStore } from './tradeStore.js';
import { bseService, BseFetchOptions } from './bseService.js';
import { wsManager } from '../websocket/websocket.js';

export class TradeService {
  public triggerTradePull(options: BseFetchOptions = {}): {
    started: boolean;
    status: number;
    message: string;
  } {
    if (tradeStore.isPulling()) {
      return {
        started: false,
        status: 409,
        message: 'A trade pull is already in progress. Concurrent duplicate pulls are prohibited.',
      };
    }

    const startedAt = new Date().toISOString();
    const delayMs = options.delayMs ?? parseInt(process.env.BSE_DELAY_MS || '10000', 10);

    tradeStore.setPullState({
      status: 'pulling',
      startedAt,
      error: null,
    });

    wsManager.broadcast({
      type: 'PULL_STATUS',
      status: 'pulling',
      startedAt,
      configuredDelayMs: delayMs,
      message: `BSE trade pull initiated with ${(delayMs / 1000).toFixed(1)}s delay`,
    });

    this.executeBackgroundPull(options, startedAt, delayMs);

    return {
      started: true,
      status: 202,
      message: 'Trade pull started',
    };
  }

  private async executeBackgroundPull(
    options: BseFetchOptions,
    startedAt: string,
    delayMs: number
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const fetchedTrades = await bseService.fetchTrades(options);
      const { addedCount, newTrades } = tradeStore.addTrades(fetchedTrades);
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      tradeStore.setPullState({
        status: 'completed',
        lastPullTime: completedAt,
        durationMs,
        error: null,
        tradesAddedLastPull: addedCount,
      });

      wsManager.broadcast({
        type: 'TRADES_UPDATED',
        trades: newTrades,
        totalCount: tradeStore.getTotalCount(),
        timestamp: completedAt,
        batchSize: addedCount,
      });
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error?.message || 'Unable to fetch trades from BSE';

      tradeStore.setPullState({
        status: 'failed',
        durationMs,
        error: errorMessage,
      });

      wsManager.broadcast({
        type: 'PULL_FAILED',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const tradeService = new TradeService();
