import React, { useState, useMemo } from 'react';
import { Trade } from '../types.js';

interface TradeTableProps {
  trades: Trade[];
}

export const TradeTable: React.FC<TradeTableProps> = ({ trades }) => {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.max(1, Math.ceil(trades.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return trades.slice(start, start + pageSize);
  }, [trades, currentPage, pageSize]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950/70 text-neutral-400 text-xs uppercase tracking-wider font-medium">
              <th className="py-3 px-4 font-mono">Trade ID</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Symbol</th>
              <th className="py-3 px-4 text-right">Quantity</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500">
                  No trades available.
                </td>
              </tr>
            ) : (
              paginatedTrades.map((trade) => (
                <tr key={trade.tradeId} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-neutral-300">{trade.tradeId}</td>
                  <td className="py-2.5 px-4 font-mono text-neutral-300">{trade.client}</td>
                  <td className="py-2.5 px-4 font-medium text-neutral-100">{trade.symbol}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{trade.quantity.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{trade.price.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-neutral-400 font-mono text-xs">{formatDate(trade.timestamp)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-neutral-800 bg-neutral-950/50 flex items-center justify-between text-xs text-neutral-400">
        <div>
          Showing page <span className="font-medium text-neutral-200">{currentPage}</span> of{' '}
          <span className="font-medium text-neutral-200">{totalPages}</span> ({trades.length.toLocaleString()} total trades)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
