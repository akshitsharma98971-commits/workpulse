import React from 'react';
import { Mail, Calendar, GitPullRequest, CheckCircle2, XCircle, RefreshCw, Key, Shield, Plus } from 'lucide-react';
import { sounds } from '../utils/audio';

export function ConnectAppsCard({ apps, onToggleApp, onSyncAll, onOpenConnectModal, isSyncing }) {
  const getIcon = (id) => {
    switch (id) {
      case 'gmail': return Mail;
      case 'calendar': return Calendar;
      case 'github': return GitPullRequest;
      default: return Mail;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-semibold border border-cyan-500/30">
              Step 1
            </span>
            <h2 className="text-xl font-bold text-slate-100">Connect your workspace</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official MCP connectors read relevant emails, meetings, issues, and pull requests securely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenConnectModal();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect & Add Data</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onSyncAll();
            }}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(apps || {}).map((app) => {
          const Icon = getIcon(app.id);
          const isConnected = app.status === 'CONNECTED';

          return (
            <div
              key={app.id}
              className={`rounded-xl p-4 border transition-all duration-300 relative group ${
                isConnected
                  ? 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isConnected
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">{app.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                      {app.repo || app.account}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-500" /> Disconnected
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 mt-2">
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-cyan-400 font-semibold">{app.itemCount}</span> items tracked
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenConnectModal();
                    }}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    + Add
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onToggleApp(app.id);
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" /> Read-only zero-trust permission scopes enforced by MCP policy
        </span>
        <span className="hidden sm:inline">MCP Protocol Version: 2024-11-05</span>
      </div>
    </div>
  );
}
