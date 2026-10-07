import { Trade, PullState } from '../types.js';

export interface GetTradesResponse {
  trades: Trade[];
  totalCount: number;
  pullState: PullState;
}

export interface PullTriggerResponse {
  message: string;
  started: boolean;
}

export async function fetchInitialTrades(): Promise<GetTradesResponse> {
  const response = await fetch('/api/trades', {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch existing trades: HTTP ${response.status}`);
  }

  return response.json();
}

export async function triggerPull(options?: {
  delayMs?: number;
  fail?: boolean;
}): Promise<PullTriggerResponse> {
  const response = await fetch('/api/trades/pull', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.message || `Trade pull failed: HTTP ${response.status}`);
  }

  return response.json();
}
