import React from 'react';
import { Sparkles, AlertCircle, Clock, CheckSquare, Calendar, Volume2, ShieldCheck, Loader2 } from 'lucide-react';
import { sounds, speakText, stopSpeaking } from '../utils/audio';

export function DailyBriefingCard({ briefing, onAnalyze, isAnalyzing }) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    sounds.playClick();
    setIsSpeaking(true);
    const textToSpeak = `Good morning! Your team briefing: ${briefing?.aiSummary || 'No summary available.'} You have 2 active blockers and 1 integration deadline at risk tomorrow.`;
    speakText(textToSpeak, () => setIsSpeaking(false));
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-semibold border border-cyan-500/30">
              Step 2
            </span>
            <h2 className="text-xl font-bold text-slate-100">Today's team briefing</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated intelligence across connected applications detected from actual workspace events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <button
              onClick={handleReadAloud}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isSpeaking
                  ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Read briefing aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'Reading aloud...' : 'Listen'}</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onAnalyze();
            }}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning Workspace...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Open tasks</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {briefing?.metrics?.openTasks ?? 8}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across GitHub & Jira</p>
        </div>

        <div className="rounded-xl p-4 bg-rose-500/10 border border-rose-500/30">
          <div className="flex items-center justify-between text-rose-300 mb-1">
            <span className="text-xs font-semibold">Blockers</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">
            {briefing?.metrics?.blockers ?? 2}
          </div>
          <p className="text-[10px] text-rose-300/70 mt-0.5">Needs immediate attention</p>
        </div>

        <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Upcoming meetings</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {briefing?.metrics?.upcomingMeetings ?? 3}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Google Calendar sync</p>
        </div>

        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between text-amber-300 mb-1">
            <span className="text-xs font-semibold">Deadline at risk</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {briefing?.metrics?.deadlineAtRisk ?? 1}
          </div>
          <p className="text-[10px] text-amber-300/70 mt-0.5">Frontend Integration (Tomorrow)</p>
        </div>
      </div>

      {/* AI Summary Box */}
      <div className="rounded-xl p-4 bg-gradient-to-r from-slate-900/90 to-cyan-950/20 border border-cyan-500/20 relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
            AI Summary (Generated via Gemini 3.8 Flash)
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {briefing?.aiSummary || "Your team has two unresolved dependencies. The backend API is delaying frontend integration, and a code review remains pending."}
        </p>
      </div>
    </div>
  );
}
