import React, { useState } from 'react';
import { Terminal, ShieldAlert, CheckCircle2, AlertTriangle, Info, X, Filter } from 'lucide-react';
import { sounds } from '../utils/audio';

export function AuditLogDrawer({ isOpen, onClose, logs = [] }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  if (!isOpen) return null;

  const filteredLogs = filterSeverity === 'ALL'
    ? logs
    : logs.filter(l => l.severity === filterSeverity);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] font-bold">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-bold">HIGH</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">WARNING</span>;
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">SUCCESS</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[10px]">INFO</span>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm text-slate-100">MCP & Security Audit Log</h3>
            <p className="text-[10px] text-slate-400 font-mono">Immutable audit trail of actions & alerts</p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 text-xs font-mono">
        <span className="text-slate-500 text-[11px] flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {['ALL', 'CRITICAL', 'WARNING', 'SUCCESS', 'INFO'].map((sev) => (
          <button
            key={sev}
            onClick={() => {
              sounds.playClick();
              setFilterSeverity(sev);
            }}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              filterSeverity === sev
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Logs stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400 font-bold">{log.action}</span>
              <div className="flex items-center gap-2">
                {getSeverityBadge(log.severity)}
                <span className="text-[10px] text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              {log.details}
            </p>

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <pre className="p-2 rounded bg-black/60 border border-slate-900 text-[10px] text-slate-400 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            )}
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No audit records matching filter "{filterSeverity}".
          </div>
        )}
      </div>
    </div>
  );
}
