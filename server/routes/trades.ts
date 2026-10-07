import { Router, Request, Response } from 'express';
import { tradeStore } from '../services/tradeStore.js';
import { tradeService } from '../services/tradeService.js';

export const tradesRouter = Router();

tradesRouter.get('/', (req: Request, res: Response) => {
  const trades = tradeStore.getAllTrades();
  const pullState = tradeStore.getPullState();

  return res.status(200).json({
    trades,
    totalCount: trades.length,
    pullState,
  });
});

tradesRouter.post('/pull', (req: Request, res: Response) => {
  const delayMs = req.body?.delayMs ?? (req.query?.delayMs ? parseInt(req.query.delayMs as string, 10) : undefined);
  const simulateFailure = req.body?.fail === true || req.query?.fail === 'true';
  const count = req.body?.count ?? (req.query?.count ? parseInt(req.query.count as string, 10) : undefined);

  const result = tradeService.triggerTradePull({
    delayMs,
    simulateFailure,
    count,
  });

  return res.status(result.status).json({
    message: result.message,
    started: result.started,
  });
});

tradesRouter.get('/status', (req: Request, res: Response) => {
  return res.status(200).json({
    pullState: tradeStore.getPullState(),
    totalCount: tradeStore.getTotalCount(),
  });
});
