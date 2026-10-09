import React from 'react';
import { Activity, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const AdminActivity = ({ logs, loading }) => {
  if (loading && logs.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm font-bold animate-pulse">
        Loading system activity audit trail...
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
