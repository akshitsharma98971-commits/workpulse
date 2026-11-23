import React, { useState } from 'react';
import { CheckCircle2, Edit3, Send, Undo2, X, ShieldAlert, Sparkles, AlertCircle, FileText, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

export function ProposalModal({ proposal, isOpen, onClose, onApprove, onEdit, onUndo, isExecuting }) {
  if (!isOpen || !proposal) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(proposal.subject || '');
  const [editedContent, setEditedContent] = useState(proposal.content || '');
  const [editedRecipient, setEditedRecipient] = useState(proposal.recipient || '');

  const isExecuted = proposal.status === 'EXECUTED';

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}
  };

  const handleApprove = async () => {
    sounds.playSuccess();
    triggerConfetti();
    await onApprove(proposal.id, {
      subject: editedSubject,
      content: editedContent,
      recipient: editedRecipient
    });
  };

  const handleSaveEdit = async () => {
    sounds.playClick();
    await onEdit(proposal.id, {
      subject: editedSubject,
      content: editedContent,
      recipient: editedRecipient
    });
    setIsEditing(false);
  };

  const handleUndo = async () => {
    sounds.playAlert();
    await onUndo(proposal.actionId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isExecuted 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}>
              {isExecuted ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Proposal #{proposal.code}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isExecuted 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {isExecuted ? 'EXECUTED VIA MCP' : 'AWAITING APPROVAL'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100">{proposal.title}</h3>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Security Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 font-mono">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Execution Policy: Explicit human approval required before invoking MCP tools.</span>
          </div>

          {/* Action Details */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Recipient
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedRecipient}
                  onChange={(e) => setEditedRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 flex items-center justify-between">
                  <span>{proposal.recipient}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Domain Verified
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Subject Line
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-sans text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 font-medium">
                  {proposal.subject}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Message Body
              </label>
              {isEditing ? (
                <textarea
                  rows={6}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              ) : (
                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed">
                  {proposal.content}
                </div>
              )}
            </div>
          </div>

          {/* Execution Result Card if executed */}
          {isExecuted && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Action Successfully Executed via MCP Tool</span>
              </div>
              <p className="text-slate-300">
                Created draft in Gmail inbox for <strong>{proposal.recipient}</strong>. Action ID: <span className="font-mono text-cyan-300">{proposal.actionId}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isExecuted && (
              isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Save Edits
                </button>
              ) : (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Draft</span>
                </button>
              )
            )}

            {isExecuted && proposal.actionId && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                title="Revert draft via MCP undo_action"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo / Revert Action</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Close
            </button>

            {!isExecuted && (
              <button
                onClick={handleApprove}
                disabled={isExecuting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Execute</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
