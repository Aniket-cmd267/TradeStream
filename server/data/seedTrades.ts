import { Trade } from '../types/trade.js';

const BSE_SYMBOLS: { symbol: string; basePrice: number; variance: number }[] = [
  { symbol: 'RELIANCE', basePrice: 2850.5, variance: 45.0 },
  { symbol: 'TCS', basePrice: 3980.0, variance: 60.0 },
  { symbol: 'INFY', basePrice: 1620.25, variance: 25.0 },
  { symbol: 'HDFCBANK', basePrice: 1540.75, variance: 20.0 },
  { symbol: 'ICICIBANK', basePrice: 1120.4, variance: 18.0 },
  { symbol: 'SBIN', basePrice: 795.1, variance: 12.0 },
  { symbol: 'ITC', basePrice: 432.8, variance: 8.0 },
  { symbol: 'LT', basePrice: 3490.6, variance: 55.0 },
  { symbol: 'AXISBANK', basePrice: 1185.3, variance: 22.0 },
  { symbol: 'KOTAKBANK', basePrice: 1780.0, variance: 28.0 },
  { symbol: 'BHARTIARTL', basePrice: 1315.5, variance: 24.0 },
  { symbol: 'MARUTI', basePrice: 12450.0, variance: 180.0 },
  { symbol: 'BAJFINANCE', basePrice: 6920.0, variance: 110.0 },
  { symbol: 'ASIANPAINT', basePrice: 2840.0, variance: 40.0 },
  { symbol: 'HINDUNILVR', basePrice: 2410.0, variance: 35.0 },
];

const CLIENT_NAMES = [
  'CLI-MEHTA-CAPITAL',
  'CLI-SHARMA-TRADING',
  'CLI-PATEL-SECURITIES',
  'CLI-SINGH-FIN',
  'CLI-KAPOOR-INVEST',
  'CLI-DESHMUKH-ALPHA',
  'CLI-VERMA-VENTURES',
  'CLI-CHOPRA-WEALTH',
  'CLI-REDDY-ASSETS',
  'CLI-NAIR-HOLDINGS',
  'CLI-JOSHI-FINSERV',
  'CLI-IYER-CAPITAL',
];

let globalTradeCounter = 1;

export function formatTradeId(counter: number): string {
  return `BSE-${String(counter).padStart(6, '0')}`;
}

export function generateTradeBatch(
  count: number,
  timeOffsetMsFromNow: number = 0,
  randomnessSeed: number = 42
): Trade[] {
  const trades: Trade[] = [];
  const baseTime = Date.now() - timeOffsetMsFromNow;

  for (let i = 0; i < count; i++) {
    const tradeNum = globalTradeCounter++;
    const symIdx = (i + randomnessSeed) % BSE_SYMBOLS.length;
    const sym = BSE_SYMBOLS[symIdx];

    const clientIdx = (i * 3 + randomnessSeed) % CLIENT_NAMES.length;
    const client = CLIENT_NAMES[clientIdx];

    const lotMultipliers = [5, 10, 25, 50, 100, 200, 500];
    const lot = lotMultipliers[(i + randomnessSeed * 7) % lotMultipliers.length];
    const quantity = lot * (((i % 10) + 1));

    const jitter = Math.sin(i * 1.3 + randomnessSeed) * sym.variance;
    const price = Number((sym.basePrice + jitter).toFixed(2));

    const tradeTime = new Date(baseTime - i * 1400);

    trades.push({
      tradeId: formatTradeId(tradeNum),
      client,
      symbol: sym.symbol,
      quantity,
      price,
      timestamp: tradeTime.toISOString(),
    });
  }

  return trades;
}

export function createInitialSeededTrades(): Trade[] {
  globalTradeCounter = 1;
  return generateTradeBatch(2500, 60 * 60 * 1000, 101);
}

export function generateFreshBseTrades(count: number = 350): Trade[] {
  const freshSeed = Math.floor(Date.now() / 1000);
  return generateTradeBatch(count, 0, freshSeed);
}
