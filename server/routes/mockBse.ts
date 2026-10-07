import { Router, Request, Response } from 'express';
import { generateFreshBseTrades } from '../data/seedTrades.js';

export const mockBseRouter = Router();

mockBseRouter.get('/getTrades', async (req: Request, res: Response) => {
  const envDelay = parseInt(process.env.BSE_DELAY_MS || '10000', 10);
  const queryDelay = req.query.delayMs ? parseInt(req.query.delayMs as string, 10) : NaN;
  const delayMs = !isNaN(queryDelay) ? queryDelay : envDelay;

  const shouldFail = req.query.fail === 'true' || req.headers['x-simulate-failure'] === 'true';
  const count = req.query.count ? parseInt(req.query.count as string, 10) : 350;

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (shouldFail) {
    return res.status(500).json({
      error: 'BSE Exchange Gateway Timeout / Connection Refused',
      code: 'BSE_500_TIMEOUT',
      timestamp: new Date().toISOString(),
    });
  }

  const trades = generateFreshBseTrades(count);
  return res.status(200).json(trades);
});
