import React, { useState, useEffect } from 'react';
import { Mail, Calendar, GitPullRequest, X, Plus, RefreshCw, CheckCircle2, Sparkles, Send, ExternalLink, Key, Shield, User, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/audio';

export function ConnectModal({ isOpen, onClose, apps, onRefreshData }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('github'); // 'github' | 'gmail' | 'calendar'

  // GitHub state
  const [githubMode, setGithubMode] = useState('active'); // 'active' | 'pat' | 'username'
  const [newGithubToken, setNewGithubToken] = useState('');
  const [newGithubUsername, setNewGithubUsername] = useState('');
  const [userRepos, setUserRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [isSyncingPRs, setIsSyncingPRs] = useState(false);
  const [isConnectingNewUser, setIsConnectingNewUser] = useState(false);
  const [githubSyncMsg, setGithubSyncMsg] = useState(null);

  // Gmail state
  const [gmailMode, setGmailMode] = useState('imap'); // 'imap' | 'token' | 'manual'
  const [gmailEmail, setGmailEmail] = useState(apps?.gmail?.account || 'akshitsharma98971@gmail.com');
  const [gmailAppPass, setGmailAppPass] = useState('');
  const [gmailToken, setGmailToken] = useState('');
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailStatusMsg, setGmailStatusMsg] = useState(null);

  // Gmail manual addition state
  const [emailSender, setEmailSender] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // Calendar state
  const [calMode, setCalMode] = useState('ics'); // 'ics' | 'manual'
  const [calIcsUrl, setCalIcsUrl] = useState('');
  const [isSyncingCal, setIsSyncingCal] = useState(false);
  const [calStatusMsg, setCalStatusMsg] = useState(null);

  // Calendar manual addition state
  const [calTitle, setCalTitle] = useState('');
  const [calTime, setCalTime] = useState('');
  const [calRisk, setCalRisk] = useState('HIGH');
  const [calAttendees, setCalAttendees] = useState('');
  const [isSubmittingCal, setIsSubmittingCal] = useState(false);

  // Fetch real GitHub repos on mount
  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    setIsFetchingRepos(true);
    try {
      const res = await fetch('/api/connectors/github/repos');
      const data = await res.json();
      if (data.repos) {
        setUserRepos(data.repos);
        if (data.repos.length > 0 && !selectedRepo) {
          setSelectedRepo(data.repos[0].name);
        }
      }
      setIsFetchingRepos(false);
    } catch (err) {
      setIsFetchingRepos(false);
    }
  };

  const handleConnectByPAT = async (e) => {
    e.preventDefault();
    if (!newGithubToken) return;
    setIsConnectingNewUser(true);
    sounds.playClick();
    setGithubSyncMsg(null);

    try {
      const res = await fetch('/api/connectors/github/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newGithubToken.trim() })
      });
      const data = await res.json();
      setIsConnectingNewUser(false);

      if (data.success) {
        sounds.playSuccess();
        setGithubSyncMsg(`Successfully connected @${data.user.login} with ${data.reposCount} repositories!`);
        setUserRepos(data.repos || []);
        setGithubMode('active');
        if (onRefreshData) onRefreshData();
      } else {
        setGithubSyncMsg(`Connection error: ${data.error}`);
      }
    } catch (err) {
      setIsConnectingNewUser(false);
      setGithubSyncMsg(`Error: ${err.message}`);
    }
  };

  const handleConnectByUsername = async (e) => {
    e.preventDefault();
    if (!newGithubUsername) return;
    setIsConnectingNewUser(true);
    sounds.playClick();
    setGithubSyncMsg(null);

    try {
      const res = await fetch('/api/connectors/github/connect-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newGithubUsername.trim() })
      });
      const data = await res.json();
      setIsConnectingNewUser(false);

      if (data.success) {
        sounds.playSuccess();
        setGithubSyncMsg(`Successfully loaded public repositories for @${data.user.login}!`);
        setUserRepos(data.repos || []);
        setGithubMode('active');
        if (onRefreshData) onRefreshData();
      } else {
        setGithubSyncMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setIsConnectingNewUser(false);
      setGithubSyncMsg(`Error: ${err.message}`);
    }
  };

  const handleSelectRepoToSync = async (repoName) => {
    const currentAccount = apps?.github?.account || 'akshitsharma98971-commits';
    const fullName = `${currentAccount}/${repoName}`;
    setIsSyncingPRs(true);
    sounds.playClick();
    setGithubSyncMsg(null);

    try {
      const res = await fetch('/api/connectors/github/select-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: fullName })
      });
      const data = await res.json();
      setIsSyncingPRs(false);

      if (data.success) {
        sounds.playSuccess();
        setGithubSyncMsg(`Successfully synced PRs and activity for ${fullName}!`);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      setIsSyncingPRs(false);
      setGithubSyncMsg(`Sync error: ${e.message}`);
    }
  };

  const handleConnectGmailImap = async (e) => {
    e.preventDefault();
    if (!gmailEmail || !gmailAppPass) return;
    setIsConnectingGmail(true);
    sounds.playClick();
    setGmailStatusMsg(null);

    try {
      const res = await fetch('/api/connectors/gmail/sync-imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gmailEmail, appPassword: gmailAppPass })
      });
      const data = await res.json();
      setIsConnectingGmail(false);

      if (data.success) {
        sounds.playSuccess();
        setGmailStatusMsg(`Success! Connected to ${gmailEmail} and imported ${data.count} recent emails.`);
        if (onRefreshData) onRefreshData();
      } else {
        setGmailStatusMsg(`Connection failed: ${data.error}`);
      }
    } catch (err) {
      setIsConnectingGmail(false);
      setGmailStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleConnectGmailToken = async (e) => {
    e.preventDefault();
    if (!gmailToken) return;
    setIsConnectingGmail(true);
    sounds.playClick();
    setGmailStatusMsg(null);

    try {
      const res = await fetch('/api/connectors/gmail/sync-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: gmailToken, email: gmailEmail })
      });
      const data = await res.json();
      setIsConnectingGmail(false);

      if (data.success) {
        sounds.playSuccess();
        setGmailStatusMsg(`Success! Fetched ${data.count} live messages via Gmail API.`);
        if (onRefreshData) onRefreshData();
      } else {
        setGmailStatusMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setIsConnectingGmail(false);
      setGmailStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleSyncCalendarIcs = async (e) => {
    e.preventDefault();
    if (!calIcsUrl) return;
    setIsSyncingCal(true);
    sounds.playClick();
    setCalStatusMsg(null);

    try {
      const res = await fetch('/api/connectors/calendar/sync-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icsUrl: calIcsUrl })
      });
      const data = await res.json();
      setIsSyncingCal(false);

      if (data.success) {
        sounds.playSuccess();
        setCalStatusMsg(`Success! Synced ${data.count} live events from your Google Calendar feed.`);
        if (onRefreshData) onRefreshData();
      } else {
        setCalStatusMsg(`Sync failed: ${data.error}`);
      }
    } catch (err) {
      setIsSyncingCal(false);
      setCalStatusMsg(`Error: ${err.message}`);
    }
  };

  const applyNewtonPreset = () => {
    sounds.playClick();
    setEmailSender('Newton <newton@123.gmail.com>');
    setEmailSubject('Final API Schema & Architecture Sign-off');
    setEmailBody('Hey Team Lead, I have reviewed the final schema definitions and security requirements. Everything looks solid for the v2 rollout. Let me know once the PR merges so we can initiate the external client tests.');
  };

  const handleAddManualEmail = async (e) => {
    e.preventDefault();
    if (!emailSender || !emailSubject) return;
    setIsSubmittingEmail(true);
    sounds.playClick();

    try {
      await fetch('/api/connectors/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          payload: {
            from: emailSender,
            subject: emailSubject,
            body: emailBody,
            snippet: emailBody.slice(0, 120)
          }
        })
      });

      sounds.playSuccess();
      setIsSubmittingEmail(false);
      setEmailSender('');
      setEmailSubject('');
      setEmailBody('');
      setGmailStatusMsg('Email successfully added to Gmail stream!');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setIsSubmittingEmail(false);
    }
  };

  const handleAddManualCalendar = async (e) => {
    e.preventDefault();
    if (!calTitle) return;
    setIsSubmittingCal(true);
    sounds.playClick();

    try {
      await fetch('/api/connectors/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'calendar',
          payload: {
            title: calTitle,
            time: calTime || 'Tomorrow, 3:00 PM',
            risk: calRisk,
            attendees: calAttendees.split(',').map(s => s.trim()).filter(Boolean)
          }
        })
      });

      sounds.playSuccess();
      setIsSubmittingCal(false);
      setCalTitle('');
      setCalTime('');
      setCalAttendees('');
      setCalStatusMsg('Event successfully added to Google Calendar stream!');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setIsSubmittingCal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Live MCP Application Connectors</h3>
              <p className="text-[11px] text-slate-400">
                Connect your actual GitHub, Gmail, and Google Calendar accounts to fetch live data
              </p>
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'github'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>GitHub Connector</span>
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'gmail'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Gmail Connector</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'calendar'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Google Calendar Connector</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* GITHUB TAB */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              {/* Account Sub-navigation */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setGithubMode('active')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    githubMode === 'active' ? 'bg-purple-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Active Account & Repos
                </button>
                <button
                  onClick={() => setGithubMode('pat')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    githubMode === 'pat' ? 'bg-purple-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Connect via Token (PAT)
                </button>
                <button
                  onClick={() => setGithubMode('username')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    githubMode === 'username' ? 'bg-purple-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Enter Username (Public)
                </button>
              </div>

              {/* Mode: Active Account */}
              {githubMode === 'active' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold font-mono text-purple-300">
                          Connected as @{apps?.github?.account || 'akshitsharma98971-commits'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Live MCP connector authenticated. Select a repository to stream real-time pull requests and review status.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      ACTIVE
                    </span>
                  </div>

                  {/* Repositories selector */}
                  <div>
                    <label className="text-xs font-bold font-mono uppercase text-slate-400 block mb-2 flex items-center justify-between">
                      <span>Select Repository to Sync ({userRepos.length})</span>
                      <button
                        onClick={fetchRepos}
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 lowercase"
                      >
                        <RefreshCw className={`w-3 h-3 ${isFetchingRepos ? 'animate-spin' : ''}`} /> refresh list
                      </button>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {userRepos.map((repo) => (
                        <div
                          key={repo.name}
                          onClick={() => {
                            setSelectedRepo(repo.name);
                            handleSelectRepoToSync(repo.name);
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            selectedRepo === repo.name
                              ? 'bg-purple-900/30 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold font-mono text-xs truncate">{repo.name}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {repo.description || 'Repository'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode: Personal Access Token (for any new user) */}
              {githubMode === 'pat' && (
                <form onSubmit={handleConnectByPAT} className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Connect any GitHub Account:
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-purple-400 underline">GitHub ➔ Developer Settings ➔ Personal Access Tokens</a>, generate a token with <code>repo</code> scope, and paste it below. WORKPULSE will connect your repositories instantly.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="ghp_... or github_pat_..."
                      value={newGithubToken}
                      onChange={(e) => setNewGithubToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isConnectingNewUser}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnectingNewUser ? 'animate-spin' : ''}`} />
                    <span>{isConnectingNewUser ? 'Authenticating with GitHub...' : 'Connect GitHub Account'}</span>
                  </button>
                </form>
              )}

              {/* Mode: Username Public Connect */}
              {githubMode === 'username' && (
                <form onSubmit={handleConnectByUsername} className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-purple-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Instant Zero-Token Mode:
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Enter any GitHub username to fetch all public repositories and inspect pull request activity without needing a token.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. torvalds or octocat or your username"
                      value={newGithubUsername}
                      onChange={(e) => setNewGithubUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isConnectingNewUser}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnectingNewUser ? 'animate-spin' : ''}`} />
                    <span>{isConnectingNewUser ? 'Fetching Repositories...' : 'Load Repositories'}</span>
                  </button>
                </form>
              )}

              {githubSyncMsg && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-mono">
                  {githubSyncMsg}
                </div>
              )}
            </div>
          )}

          {/* GMAIL TAB */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setGmailMode('imap')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    gmailMode === 'imap' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                  }`}
                >
                  Gmail App Password (IMAP)
                </button>
                <button
                  onClick={() => setGmailMode('token')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    gmailMode === 'token' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                  }`}
                >
                  Google OAuth Token
                </button>
                <button
                  onClick={() => setGmailMode('manual')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    gmailMode === 'manual' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                  }`}
                >
                  Direct Email / Preset
                </button>
              </div>

              {/* Mode: IMAP with App Password */}
              {gmailMode === 'imap' && (
                <form onSubmit={handleConnectGmailImap} className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> How any user connects their live Gmail:
                    </div>
                    <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-0.5">
                      <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google Account ➔ App Passwords</a>.</li>
                      <li>Generate a 16-character App Password for "Mail".</li>
                      <li>Paste it below to fetch your real inbox over TLS IMAP.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Your Gmail Address
                    </label>
                    <input
                      type="email"
                      required
                      value={gmailEmail}
                      onChange={(e) => setGmailEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Google App Password (16 characters)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="e.g. abcd efgh ijkl mnop"
                      value={gmailAppPass}
                      onChange={(e) => setGmailAppPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isConnectingGmail}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnectingGmail ? 'animate-spin' : ''}`} />
                    <span>{isConnectingGmail ? 'Connecting to imap.gmail.com...' : 'Connect Live Gmail & Fetch Emails'}</span>
                  </button>
                </form>
              )}

              {/* Mode: Google OAuth Token */}
              {gmailMode === 'token' && (
                <form onSubmit={handleConnectGmailToken} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Google OAuth Access Token (Bearer)
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Paste your ya29... Google OAuth token"
                      value={gmailToken}
                      onChange={(e) => setGmailToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isConnectingGmail}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
                  >
                    <span>Connect via Gmail REST API</span>
                  </button>
                </form>
              )}

              {/* Mode: Direct / Newton Preset */}
              {gmailMode === 'manual' && (
                <form onSubmit={handleAddManualEmail} className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-300">Quickly inject test message:</span>
                    <button
                      type="button"
                      onClick={applyNewtonPreset}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/30"
                    >
                      Preset: newton@123.gmail.com
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">From</label>
                    <input
                      type="text"
                      required
                      placeholder="Sender name <email>"
                      value={emailSender}
                      onChange={(e) => setEmailSender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Body</label>
                    <textarea
                      rows={3}
                      required
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingEmail}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
                  >
                    <span>Add Email to Stream</span>
                  </button>
                </form>
              )}

              {gmailStatusMsg && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                  {gmailStatusMsg}
                </div>
              )}
            </div>
          )}

          {/* CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setCalMode('ics')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    calMode === 'ics' ? 'bg-emerald-500 text-black' : 'text-slate-400'
                  }`}
                >
                  Secret iCal (.ics) Link
                </button>
                <button
                  onClick={() => setCalMode('manual')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    calMode === 'manual' ? 'bg-emerald-500 text-black' : 'text-slate-400'
                  }`}
                >
                  Direct Event
                </button>
              </div>

              {/* Mode: Secret iCal Feed URL */}
              {calMode === 'ics' && (
                <form onSubmit={handleSyncCalendarIcs} className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> How any user connects Google Calendar in 10 seconds:
                    </div>
                    <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-0.5">
                      <li>Open <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Google Calendar</a> in your browser.</li>
                      <li>Click the 3 dots next to your calendar ➔ <strong>Settings and sharing</strong>.</li>
                      <li>Scroll down to <strong>Integrate calendar</strong> and copy the <strong>Secret address in iCal format</strong>.</li>
                      <li>Paste the URL below to automatically parse all your real meetings and deadlines!</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Secret address in iCal format (.ics URL)
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                      value={calIcsUrl}
                      onChange={(e) => setCalIcsUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSyncingCal}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCal ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCal ? 'Parsing Calendar Feed...' : 'Sync Live Google Calendar'}</span>
                  </button>
                </form>
              )}

              {/* Mode: Manual Event */}
              {calMode === 'manual' && (
                <form onSubmit={handleAddManualCalendar} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Architecture Review"
                      value={calTitle}
                      onChange={(e) => setCalTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Date & Time</label>
                      <input
                        type="text"
                        placeholder="Tomorrow, 4:00 PM"
                        value={calTime}
                        onChange={(e) => setCalTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Risk</label>
                      <select
                        value={calRisk}
                        onChange={(e) => setCalRisk(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="HIGH">HIGH (Deadline)</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCal}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                  >
                    <span>Add Event to Calendar</span>
                  </button>
                </form>
              )}

              {calStatusMsg && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300">
                  {calStatusMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
