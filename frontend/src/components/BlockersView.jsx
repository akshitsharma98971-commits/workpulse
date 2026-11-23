import React, { useState } from 'react';
import { AlertTriangle, GitPullRequest, Mail, Calendar, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';

export function BlockersView({ blockers, onSelectBlockerAction }) {
  const [selectedBlockerId, setSelectedBlockerId] = useState(blockers[0]?.id || 'blocker-001');

  const selectedBlocker = blockers.find(b => b.id === selectedBlockerId) || blockers[0];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-semibold border border-cyan-500/30">
              Step 3
            </span>
            <h2 className="text-xl font-bold text-slate-100">Detect blockers & dependencies</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            WORKPULSE continuously cross-references Gmail, Calendar, and GitHub to surface delays before deadlines fail.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{blockers.length} Active Blockers Identified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Blocker Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {blockers.map((blocker) => {
            const isSelected = selectedBlocker?.id === blocker.id;
            const isResolved = blocker.status === 'RESOLVED';

            return (
              <div
                key={blocker.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedBlockerId(blocker.id);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                } ${isResolved ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      Blocker {blocker.code}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      blocker.priority.toLowerCase().includes('high')
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {blocker.priority}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80">
                    {blocker.category}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100 mb-1 flex items-center justify-between">
                  <span>{blocker.title}</span>
                  {isResolved && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {blocker.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Sources:</span>
                    {blocker.detectedFrom.map((src, i) => (
                      <span key={i} className="text-cyan-400 font-mono text-[10px] px-1.5 py-0.2 bg-cyan-950/40 rounded border border-cyan-800/40">
                        {src}
                      </span>
                    ))}
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Blocker Detailed Evidence & Dependency Inspector */}
        <div className="lg:col-span-7 rounded-xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between">
          {selectedBlocker ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      Blocker {selectedBlocker.code}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Detected from {selectedBlocker.detectedFrom.join(" + ")}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-100">
                    {selectedBlocker.title}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    sounds.playClick();
                    onSelectBlockerAction(selectedBlocker);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Propose Action</span>
                </button>
              </div>

              {/* Evidence Section */}
              <div className="mb-5">
                <div className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cross-Application Evidence (Verified by MCP)</span>
                </div>
                <div className="space-y-2">
                  {selectedBlocker.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                    >
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 bg-slate-800 text-cyan-400 font-mono text-[10px] font-bold">
                        {ev.source.includes('Gmail') ? <Mail className="w-3.5 h-3.5" /> : ev.source.includes('GitHub') ? <GitPullRequest className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-300 font-mono text-[11px] mb-0.5">
                          {ev.source}
                        </div>
                        <div className="text-slate-400 leading-relaxed">
                          {ev.text}
                        </div>
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Dependency Chain */}
              <div className="mb-5">
                <div className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Dependency Chain
                </div>
                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    Backend API (#402)
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold font-mono">
                    Frontend Integration
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold font-mono">
                    Final Testing
                  </div>
                </div>
              </div>

              {/* Suggested Action Box */}
              <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase mb-1">
                  AI Recommendation
                </div>
                <p className="text-xs text-slate-200">
                  {selectedBlocker.suggestedAction}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">Select a blocker to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
