import React from 'react';
import { useTradeWebSocket } from './hooks/useTradeWebSocket.js';
import { Header } from './components/Header.js';
import { TradeTable } from './components/TradeTable.js';

export default function App() {
  const {
    trades,
    totalCount,
    pullState,
    startPull,
  } = useTradeWebSocket();

  const isPulling = pullState.status === 'pulling';

  const handlePullLatest = () => {
    startPull();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Header
        totalTrades={totalCount}
        lastPullTime={pullState.lastPullTime}
        pullStatus={pullState.status}
        onPullTrades={handlePullLatest}
        isPulling={isPulling}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TradeTable trades={trades} />
      </main>
    </div>
  );
}
