import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Send, Bot, User, CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';
import { sounds, speakText, stopSpeaking } from '../utils/audio';

export function VoiceAssistant({ isOpen, onClose, onApproveProposal, onTriggerAction }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am WORKPULSE. You can ask me anything about your connected Gmail, Google Calendar, and GitHub workspaces—like checking the latest emails, merged PRs, blockers, or hearing your daily briefing.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Web Speech Recognition setup
  useEffect(() => {
    let recognition = null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && isListening) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        sounds.playClick();
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (e) {
        setIsListening(false);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      stopSpeaking();
      setIsListening(true);
    }
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    sounds.playClick();
    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setIsThinking(false);

      const assistantMsg = {
        sender: 'assistant',
        text: data.reply || "I've processed your request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        needsConfirmation: data.needsConfirmation,
        proposalCode: data.proposalCode,
        suggestedActions: data.suggestedActions
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If needs confirmation for voice approval
      if (data.needsConfirmation) {
        setPendingConfirmation({
          proposalCode: data.proposalCode,
          proposalId: data.proposalId
        });
      }

      // If voice confirmation succeeded
      if (data.confirmed) {
        sounds.playSuccess();
        if (onApproveProposal) {
          onApproveProposal('prop-001');
        }
        setPendingConfirmation(null);
      }

      // Speak response out loud
      speakText(assistantMsg.text);
    } catch (err) {
      setIsThinking(false);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I encountered an error connecting to the intelligence service.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const confirmAction = async () => {
    sounds.playSuccess();
    handleSend('yes, confirm');
  };

  const presetCommands = [
    "What was the last mail from newton@123.gmail.com?",
    "What was the last PR merged?",
    "Review all connected apps",
    "Why are we behind schedule?",
    "Give me today's briefing",
    "Find my blockers"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-900 border-l border-cyan-500/30 shadow-2xl shadow-cyan-500/20 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>WORKPULSE AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Voice & text workspace intelligence queries
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            stopSpeaking();
            onClose();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Quick Commands */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {presetCommands.map((cmd, i) => (
          <button
            key={i}
            onClick={() => handleSend(cmd)}
            className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-700/80 text-slate-300 whitespace-nowrap transition-all"
          >
            "{cmd}"
          </button>
        ))}
      </div>

      {/* Messages Conversation Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                isUser
                  ? 'bg-cyan-500 text-black font-medium'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200'
              }`}>
                <p className="leading-relaxed whitespace-pre-line">{m.text}</p>

                {/* Suggestion action inside message */}
                {m.suggestedActions?.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(act.command)}
                    className="mt-2 block w-full text-left px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-semibold hover:bg-cyan-500/20 transition-colors"
                  >
                    👉 {act.label}
                  </button>
                ))}

                {/* Confirmation Box if awaiting approval */}
                {m.needsConfirmation && pendingConfirmation && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Approval Confirmation Required</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Explicit confirmation prevents accidental execution via voice.
                    </p>
                    <button
                      onClick={confirmAction}
                      className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Proposal #{pendingConfirmation.proposalCode}</span>
                    </button>
                  </div>
                )}

                <div className={`text-[10px] mt-1 font-mono ${isUser ? 'text-black/60 text-right' : 'text-slate-500'}`}>
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Analyzing connected apps data...</span>
          </div>
        )}
      </div>

      {/* Voice Waveform visualizer if listening */}
      {isListening && (
        <div className="px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/30 flex items-center justify-center gap-1.5">
          <span className="text-xs font-mono text-cyan-300 mr-2">Listening...</span>
          <div className="w-1.5 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-7 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <div className="w-1.5 h-8 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
          <div className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '250ms' }} />
        </div>
      )}

      {/* Input Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
          }`}
          title={isListening ? "Stop listening" : "Start speaking"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask e.g. What was the last mail from newton@123.gmail.com?"
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />

        <button
          onClick={() => handleSend()}
          className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all disabled:opacity-50"
          disabled={!inputValue.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
