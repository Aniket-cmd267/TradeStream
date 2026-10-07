import React from 'react';
import { PullStatus } from '../types.js';

interface HeaderProps {
  totalTrades: number;
  lastPullTime: string | null;
  pullStatus: PullStatus;
  onPullTrades: () => void;
  isPulling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalTrades,
  lastPullTime,
  pullStatus,
  onPullTrades,
  isPulling,
}) => {
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour12: false });
    } catch {
      return isoString;
    }
  };

  const getStatusLabel = () => {
    switch (pullStatus) {
      case 'pulling':
        return 'Pulling...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Idle';
    }
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">
            TradeStream
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Total Trades:</span>
            <span className="font-semibold text-neutral-100">
              {totalTrades.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Last Pull:</span>
            <span className="font-medium text-neutral-200">
              {formatTime(lastPullTime)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Status:</span>
            <span
              className={`font-medium ${
                pullStatus === 'pulling'
                  ? 'text-blue-400'
                  : pullStatus === 'failed'
                  ? 'text-red-400'
                  : pullStatus === 'completed'
                  ? 'text-emerald-400'
                  : 'text-neutral-300'
              }`}
            >
              {getStatusLabel()}
            </span>
          </div>
        </div>

        <div>
          <button
            onClick={onPullTrades}
            disabled={isPulling}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed rounded transition-colors cursor-pointer"
          >
            {isPulling ? 'Pulling...' : 'Pull Latest Trades'}
          </button>
        </div>
      </div>
    </header>
  );
};
