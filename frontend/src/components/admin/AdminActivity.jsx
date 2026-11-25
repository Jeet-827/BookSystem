import React from 'react';
import { Activity, Clock, AlertCircle, RefreshCw } from 'lucide-react';

const AdminActivity = ({ logs, loading, error, onRetry }) => {
  if (loading && logs.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm font-bold animate-pulse bg-[#13161c] rounded-2xl border border-gray-800">
        Loading system activity audit trail...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-6 text-center bg-red-500/5 rounded-2xl border border-red-500/30 space-y-4">
        <div className="w-10 h-10 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-sm font-extrabold text-white">Failed to Load Activity Logs</h3>
          <p className="text-xs text-red-300">{error}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-bold transition-all"
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500 text-sm font-bold bg-[#13161c] rounded-2xl border border-gray-800">
        No administrative activity logs recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-[#13161c] border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
        <Activity size={18} className="text-amber-400" />
        <h3 className="font-extrabold text-sm sm:text-base text-white font-display">
          Administrative Audit Trail
        </h3>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log._id}
            className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {log.action}
                </span>
                <span className="text-xs font-bold text-gray-300">{log.adminEmail}</span>
              </div>
              <p className="text-xs text-gray-400 font-mono leading-relaxed">
                {typeof log.details === 'object'
                  ? JSON.stringify(log.details)
                  : String(log.details || '')}
              </p>
            </div>

            <div className="text-right flex-shrink-0 text-[11px] text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminActivity;
