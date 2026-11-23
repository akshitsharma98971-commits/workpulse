import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { JourneyStepper } from './components/JourneyStepper';
import { ConnectAppsCard } from './components/ConnectAppsCard';
import { DailyBriefingCard } from './components/DailyBriefingCard';
import { BlockersView } from './components/BlockersView';
import { ProposalModal } from './components/ProposalModal';
import { SecurityDemo } from './components/SecurityDemo';
import { VoiceAssistant } from './components/VoiceAssistant';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { ConnectModal } from './components/ConnectModal';
import { ShieldCheck } from 'lucide-react';
import { sounds } from './utils/audio';

export function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState(null);
  const [connectedApps, setConnectedApps] = useState({});
  const [briefing, setBriefing] = useState(null);
  const [blockers, setBlockers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [lastSecurityTest, setLastSecurityTest] = useState(null);

  // Loaders
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isTestingSecurity, setIsTestingSecurity] = useState(false);

  // Modals & Drawers
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Initial Fetch
  const fetchData = async () => {
    try {
      const [statusRes, blockersRes, proposalsRes, auditRes, secRes] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/blockers').then(r => r.json()),
        fetch('/api/proposals').then(r => r.json()),
        fetch('/api/audit').then(r => r.json()),
        fetch('/api/security/alerts').then(r => r.json()),
      ]);

      setStatus(statusRes);
      setConnectedApps(statusRes.connectedApps || {});
      setBlockers(blockersRes.blockers || []);
      setProposals(proposalsRes || []);
      setAuditLogs(auditRes || []);
      setSecurityAlerts(secRes.alerts || []);

      if (proposalsRes && proposalsRes.length > 0) {
        setSelectedProposal(proposalsRes[0]);
      }
    } catch (err) {
      console.warn("Failed fetching backend state:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Step 1: Toggle App Connection
  const handleToggleApp = async (appId) => {
    try {
      const res = await fetch('/api/connectors/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId })
      });
      const data = await res.json();
      if (data.success) {
        setConnectedApps(prev => ({
          ...prev,
          [appId]: data.app
        }));
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    sounds.playClick();
    setTimeout(async () => {
      await fetchData();
      setIsSyncing(false);
      sounds.playSuccess();
    }, 800);
  };

  // Step 2: Analyze Workspace (Daily Briefing)
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    sounds.playClick();
    try {
      const res = await fetch('/api/workspace/analyze', { method: 'POST' });
      const data = await res.json();
      setBriefing(data);
      setIsAnalyzing(false);
      sounds.playSuccess();
      setCurrentStep(2);
      await fetchData();
    } catch (e) {
      setIsAnalyzing(false);
      console.error(e);
    }
  };

  // Step 3 -> 4: Propose Action from Blocker
  const handleSelectBlockerAction = (blocker) => {
    const prop = proposals.find(p => p.blockerId === blocker.id) || proposals[0];
    if (prop) {
      setSelectedProposal(prop);
      setIsProposalModalOpen(true);
      setCurrentStep(4);
    }
  };

  // Step 4: Approve Proposal
  const handleApproveProposal = async (proposalId, modifications) => {
    setIsExecutingAction(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval: true, modifications })
      });
      const data = await res.json();
      setIsExecutingAction(false);

      if (data.proposal) {
        setSelectedProposal(data.proposal);
        setProposals(prev => prev.map(p => p.id === data.proposal.id ? data.proposal : p));
      }
      await fetchData();
    } catch (e) {
      setIsExecutingAction(false);
      console.error(e);
    }
  };

  // Step 4: Edit Proposal
  const handleEditProposal = async (proposalId, edits) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits)
      });
      const data = await res.json();
      if (data.proposal) {
        setSelectedProposal(data.proposal);
        setProposals(prev => prev.map(p => p.id === data.proposal.id ? data.proposal : p));
      }
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Step 4: Undo Action
  const handleUndoAction = async (actionId) => {
    try {
      const res = await fetch('/api/actions/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setIsProposalModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Step 5: Test Injection
  const handleRunSecurityTest = async (type) => {
    setIsTestingSecurity(true);
    try {
      const res = await fetch('/api/security/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      setLastSecurityTest(data);
      setSecurityAlerts(data.activeAlerts || []);
      setIsTestingSecurity(false);
      setCurrentStep(5);
      await fetchData();
    } catch (e) {
      setIsTestingSecurity(false);
      console.error(e);
    }
  };

  const handleClearAlerts = async () => {
    try {
      await fetch('/api/security/clear', { method: 'POST' });
      setSecurityAlerts([]);
      setLastSecurityTest(null);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Demo
  const handleResetDemo = async () => {
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setLastSecurityTest(null);
      setCurrentStep(1);
      setBriefing(null);
      await fetchData();
      sounds.playSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        onResetDemo={handleResetDemo}
        onToggleVoice={() => setIsVoiceOpen(prev => !prev)}
        isVoiceActive={isVoiceOpen}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        auditCount={auditLogs.length}
        alertCount={securityAlerts.length}
        status={status}
      />

      {/* Interactive 6-Step Roadmap */}
      <JourneyStepper
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
      />

      {/* Hero Pitch Banner */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-[#0d1527] to-slate-900 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-cyan-400 font-mono">WORKPULSE:</span>
            <span className="text-slate-300">
              "An MCP-powered AI team assistant that connects workplace applications, detects hidden blockers, recommends solutions and safely executes approved actions."
            </span>
          </div>
          <div className="font-mono text-[11px] text-emerald-400/90 flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Trust Policy Active</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Panels */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step 1: Connect Applications */}
        <section id="step-1">
          <ConnectAppsCard
            apps={connectedApps}
            onToggleApp={handleToggleApp}
            onSyncAll={handleSyncAll}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            isSyncing={isSyncing}
          />
        </section>

        {/* Step 2: Daily Briefing */}
        <section id="step-2">
          <DailyBriefingCard
            briefing={briefing}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </section>

        {/* Step 3: Detect Blockers & Dependency Chains */}
        <section id="step-3">
          <BlockersView
            blockers={blockers}
            onSelectBlockerAction={handleSelectBlockerAction}
          />
        </section>

        {/* Step 5: Prompt Injection Defense Live Playground */}
        <section id="step-5">
          <SecurityDemo
            onRunTest={handleRunSecurityTest}
            isTesting={isTestingSecurity}
            lastResult={lastSecurityTest}
            alerts={securityAlerts}
            onClearAlerts={handleClearAlerts}
          />
        </section>
      </main>

      {/* Floating Action Button for AI Assistant if closed */}
      {!isVoiceOpen && (
        <button
          onClick={() => {
            sounds.playClick();
            setIsVoiceOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
          <span>Ask WORKPULSE</span>
        </button>
      )}

      {/* Connect & Add Data Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        apps={connectedApps}
        onRefreshData={fetchData}
      />

      {/* Step 4: Proposal Action Modal */}
      <ProposalModal
        proposal={selectedProposal}
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onApprove={handleApproveProposal}
        onEdit={handleEditProposal}
        onUndo={handleUndoAction}
        isExecuting={isExecutingAction}
      />

      {/* Step 6: Voice & Query Assistant Drawer */}
      <VoiceAssistant
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApproveProposal={handleApproveProposal}
      />

      {/* Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={auditLogs}
      />
    </div>
  );
}
export default App;
