import { Trade } from '../types/trade.js';

export interface BseFetchOptions {
  delayMs?: number;
  simulateFailure?: boolean;
  count?: number;
}

export class BseService {
  public async fetchTrades(options: BseFetchOptions = {}): Promise<Trade[]> {
    const port = process.env.PORT || '3000';
    const baseUrl = process.env.BSE_API_URL || `http://127.0.0.1:${port}/getTrades`;

    const url = new URL(baseUrl);
    if (options.delayMs !== undefined) {
      url.searchParams.set('delayMs', String(options.delayMs));
    }
    if (options.simulateFailure) {
      url.searchParams.set('fail', 'true');
    }
    if (options.count) {
      url.searchParams.set('count', String(options.count));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        const errJson = await response.json();
        errorBody = errJson.error || JSON.stringify(errJson);
      } catch {
        errorBody = await response.text();
      }
      throw new Error(`BSE API returned HTTP ${response.status}: ${errorBody || response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Malformed trade data received: Expected JSON array of trades from BSE.');
    }

    for (let i = 0; i < Math.min(5, data.length); i++) {
      const item = data[i];
      if (!item.tradeId || !item.client || !item.symbol || typeof item.price !== 'number') {
        throw new Error(`Malformed trade item at index ${i}: Missing required fields.`);
      }
    }

    return data as Trade[];
  }
}

export const bseService = new BseService();
