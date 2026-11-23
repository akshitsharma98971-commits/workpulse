import React from 'react';
import { Network, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, Mic } from 'lucide-react';
import { sounds } from '../utils/audio';

export function JourneyStepper({ currentStep, onSelectStep }) {
  const steps = [
    { id: 1, label: "1. Connect Apps", icon: Network, desc: "Gmail, Calendar, GitHub" },
    { id: 2, label: "2. Daily Briefing", icon: Sparkles, desc: "Analyze Workspace" },
    { id: 3, label: "3. Detect Blockers", icon: AlertTriangle, desc: "Evidence & Dependencies" },
    { id: 4, label: "4. Propose & Execute", icon: CheckCircle2, desc: "Safe MCP Action" },
    { id: 5, label: "5. Prompt Defense", icon: ShieldAlert, desc: "Injection Interception" },
    { id: 6, label: "6. Voice & Query", icon: Mic, desc: "Ask Specific App Data" },
  ];

  return (
    <div className="w-full bg-slate-900/60 border-b border-slate-800/80 px-4 py-3 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[700px] gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => {
                  sounds.playClick();
                  onSelectStep(step.id);
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all text-left group ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : isCompleted
                    ? 'hover:bg-slate-800/60 text-emerald-400/90'
                    : 'hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isActive ? 'text-cyan-200' : isCompleted ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-500 hidden xl:block">
                    {step.desc}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div className="flex-1 h-[1px] bg-slate-800 hidden md:block max-w-[28px]" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
