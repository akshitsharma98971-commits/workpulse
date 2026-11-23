import React from 'react';
import { ShieldCheck, Cpu, Mic, RotateCcw, Activity, Terminal, PlusCircle, Plus } from 'lucide-react';
import { sounds } from '../utils/audio';

export function Header({ 
  onResetDemo, 
  onToggleVoice, 
  isVoiceActive, 
  onOpenAudit, 
  onOpenConnectModal,
  auditCount = 0,
  alertCount = 0,
  status
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-800 to-emerald-500/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                WORKPULSE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> MCP Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI Team Intelligence & Autonomous Action Platform
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Add / Connect Apps button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenConnectModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all active:scale-95"
            title="Connect Accounts or Add Emails/PRs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connect & Add</span>
          </button>

          {/* Gemini Model Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-slate-400">Model:</span>
            <span className="font-semibold text-slate-200">Gemini 3.8 Flash</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          {/* Security Alert Badge */}
          {alertCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/40 text-xs text-rose-300 animate-bounce">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold">{alertCount} Blocked</span>
            </div>
          )}

          {/* Voice Assistant Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              onToggleVoice();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isVoiceActive
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{isVoiceActive ? 'Voice Active' : 'AI Assistant'}</span>
          </button>

          {/* Audit Log Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAudit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            title="Open MCP Audit Log"
          >
            <span className="font-mono text-cyan-400">Audit</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800 font-mono">
              {auditCount}
            </span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onResetDemo();
            }}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset to Initial Demo State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
