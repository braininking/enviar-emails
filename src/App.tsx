import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { NewCampaignPage } from './pages/NewCampaignPage';
import { CampaignsHistoryPage } from './pages/CampaignsHistoryPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { VagasSearchPage } from './pages/VagasSearchPage';
import { SendingQueueView } from './components/SendingQueueView';
import {
  Campaign,
  EmailTemplate,
  Recipient,
  AttachmentFile,
  UserProfile,
} from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/authService';
import {
  getCampaigns,
  saveCampaign,
  deleteCampaign,
  getInterruptedCampaign,
  saveInterruptedCampaign,
  clearInterruptedCampaign,
} from './services/campaignService';
import { getTemplates } from './services/templateService';
import {
  createMimeMessage,
  sendGmailMessage,
  personalizeText,
} from './services/gmailService';
import { RotateCcw, LayoutDashboard, MailPlus, Inbox, FileText, Search, Settings } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Active Sending Campaign state
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [interruptedCampaign, setInterruptedCampaign] = useState<Campaign | null>(null);
  const [initialNewCampaignTemplate, setInitialNewCampaignTemplate] = useState<EmailTemplate | null>(null);
  const [importedEmailsFromVagas, setImportedEmailsFromVagas] = useState<string[]>([]);

  // Queue runner refs to allow Pause/Resume/Cancel
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  // Initialize auth & local data
  useEffect(() => {
    // Load initial campaigns & templates
    const storedCampaigns = getCampaigns();
    setCampaigns(storedCampaigns);

    const storedTemplates = getTemplates();
    setTemplates(storedTemplates);

    // Check for interrupted campaign from earlier session
    const interr = getInterruptedCampaign();
    if (interr && interr.status === 'in_progress') {
      setInterruptedCampaign(interr);
    }

    // Init Firebase Auth
    const unsubscribe = initAuth(
      (profile) => {
        setUser(profile);
      },
      () => {
        // Not authenticated
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailResult = params.get('gmail');
    const reason = params.get('reason');

    if (gmailResult === 'error') {
      window.history.replaceState({}, '', window.location.pathname);
      alert(`Não foi possível conectar o Gmail: ${reason ? decodeURIComponent(reason) : 'erro desconhecido'}`);
    } else if (gmailResult === 'denied') {
      window.history.replaceState({}, '', window.location.pathname);
      alert('A autorização do Gmail foi cancelada.');
    } else if (gmailResult === 'connected') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnectGmail = async () => {
    try {
      setIsConnecting(true);
      await googleSignIn();
    } catch (err: any) {
      setIsConnecting(false);
      alert(`Não foi possível conectar ao Gmail: ${err.message || err}`);
    }
  };

  const handleDisconnectGmail = async () => {
    await logout();
    setUser(null);
  };

  // Start Campaign Execution with queue & anti-spam delay
  const handleStartCampaign = async ({
    senderEmail,
    subject,
    message,
    recipients,
    attachments,
  }: {
    senderEmail: string;
    subject: string;
    message: string;
    recipients: Recipient[];
    attachments: AttachmentFile[];
  }) => {
    const newCamp: Campaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderEmail,
      subject,
      message,
      status: 'in_progress',
      recipients: recipients.map((r) => ({ ...r, status: 'pending' })),
      attachments,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      pendingCount: recipients.length,
      createdAt: new Date().toISOString(),
      lastActiveIndex: 0,
    };

    setActiveCampaign(newCamp);
    saveInterruptedCampaign(newCamp);

    // Run sending process
    runQueueExecution(newCamp, 0);
  };

  // Core Queue Processing Logic
  const runQueueExecution = async (campaignData: Campaign, startIndex = 0) => {
    isPausedRef.current = false;
    isCancelledRef.current = false;
    let current = { ...campaignData };
    const recipientsList = [...current.recipients];
    for (let i = startIndex; i < recipientsList.length; i++) {
      // Check for pause
      if (isPausedRef.current) {
        current = {
          ...current,
          status: 'paused',
          lastActiveIndex: i,
        };
        setActiveCampaign(current);
        saveInterruptedCampaign(current);
        saveCampaign(current);
        return;
      }

      // Check for cancel
      if (isCancelledRef.current) {
        // Mark remaining as cancelled
        for (let j = i; j < recipientsList.length; j++) {
          if (recipientsList[j].status === 'pending') {
            recipientsList[j] = { ...recipientsList[j], status: 'cancelled' };
          }
        }
        current = {
          ...current,
          status: 'cancelled',
          recipients: recipientsList,
          completedAt: new Date().toISOString(),
        };
        setActiveCampaign(current);
        clearInterruptedCampaign();
        saveCampaign(current);
        setCampaigns(getCampaigns());
        return;
      }

      // Mark current as sending
      recipientsList[i] = { ...recipientsList[i], status: 'sending' };
      current = { ...current, recipients: recipientsList };
      setActiveCampaign({ ...current });

      const target = recipientsList[i];
      const personalizedSubj = personalizeText(current.subject, target);
      const personalizedBody = personalizeText(current.message, target);

      try {
        const rawBase64Url = createMimeMessage({
          to: target.email,
          from: current.senderEmail,
          subject: personalizedSubj,
          bodyPlain: personalizedBody,
          attachments: current.attachments,
        });
        await sendGmailMessage({ rawBase64Url });

        // Mark as success
        recipientsList[i] = {
          ...recipientsList[i],
          status: 'sent',
          sentAt: new Date().toISOString(),
        };
        current.sentCount = (current.sentCount || 0) + 1;
        current.pendingCount = Math.max(0, (current.pendingCount || 1) - 1);
      } catch (err: any) {
        console.error(`Erro ao enviar para ${target.email}:`, err);
        const errMsg = err.message || '';
        const userFriendlyError = err?.code === 'GMAIL_REAUTH_REQUIRED'
          ? 'A autorização do Gmail expirou ou foi revogada. Conecte o Gmail novamente.'
          : (errMsg || 'Erro ao comunicar com o Gmail.');

        recipientsList[i] = {
          ...recipientsList[i],
          status: 'failed',
          error: userFriendlyError,
          sentAt: new Date().toISOString(),
        };
        current.failedCount = (current.failedCount || 0) + 1;
        current.pendingCount = Math.max(0, (current.pendingCount || 1) - 1);
      }

      current = {
        ...current,
        recipients: [...recipientsList],
        lastActiveIndex: i + 1,
      };
      setActiveCampaign({ ...current });
      saveInterruptedCampaign(current);

      // Controlled interval between messages (1000ms) to respect Gmail rate limits
      if (i < recipientsList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Completed whole queue
    current = {
      ...current,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    setActiveCampaign(current);
    clearInterruptedCampaign();
    saveCampaign(current);
    setCampaigns(getCampaigns());
  };

  const handlePauseQueue = () => {
    isPausedRef.current = true;
    if (activeCampaign) {
      const updated: Campaign = { ...activeCampaign, status: 'paused' };
      setActiveCampaign(updated);
      saveCampaign(updated);
      saveInterruptedCampaign(updated);
    }
  };

  const handleResumeQueue = () => {
    if (!activeCampaign) return;
    const startIndex = activeCampaign.lastActiveIndex || 0;
    const updated: Campaign = { ...activeCampaign, status: 'in_progress' };
    setActiveCampaign(updated);
    runQueueExecution(updated, startIndex);
  };

  const handleCancelQueue = () => {
    isCancelledRef.current = true;
  };

  const handleFinishViewQueue = () => {
    setActiveCampaign(null);
    setCurrentTab('campaigns');
    setCampaigns(getCampaigns());
  };

  // Interrupted campaign recovery
  const handleResumeInterrupted = () => {
    if (!interruptedCampaign) return;
    const campToResume = { ...interruptedCampaign };
    setInterruptedCampaign(null);
    setActiveCampaign(campToResume);
    const startIdx = campToResume.lastActiveIndex || 0;
    runQueueExecution(campToResume, startIdx);
  };

  const handleDiscardInterrupted = () => {
    clearInterruptedCampaign();
    setInterruptedCampaign(null);
  };

  const handleDeleteCampaign = (id: string) => {
    deleteCampaign(id);
    setCampaigns(getCampaigns());
  };

  const handleUseTemplate = (tpl: EmailTemplate) => {
    setInitialNewCampaignTemplate(tpl);
    setCurrentTab('new_campaign');
  };

  const handleTransferVagasEmailsToCampaign = (emails: string[]) => {
    setImportedEmailsFromVagas(emails);
    setCurrentTab('new_campaign');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        user={user}
        onConnect={handleConnectGmail}
        onDisconnect={handleDisconnectGmail}
        isConnecting={isConnecting}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onChangeTab={(tab) => {
            setActiveCampaign(null);
            setCurrentTab(tab);
          }}
          campaignsCount={campaigns.length}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Recovery Notification if interrupted campaign found */}
          {interruptedCampaign && !activeCampaign && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Campanha interrompida encontrada
                  </h4>
                  <p className="text-xs text-amber-200/80">
                    O envio de "{interruptedCampaign.subject}" ({interruptedCampaign.sentCount}/
                    {interruptedCampaign.totalRecipients}) foi pausado. Deseja continuar de onde parou?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResumeInterrupted}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Continuar
                </button>
                <button
                  onClick={handleDiscardInterrupted}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          {/* Active Sending Queue takes over current screen */}
          {activeCampaign ? (
            <SendingQueueView
              campaign={activeCampaign}
              onPause={handlePauseQueue}
              onResume={handleResumeQueue}
              onCancel={handleCancelQueue}
              onFinish={handleFinishViewQueue}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardPage
                  onNewCampaign={() => setCurrentTab('new_campaign')}
                  onViewCampaign={() => {
                    setCurrentTab('campaigns');
                  }}
                  onGoToCampaigns={() => setCurrentTab('campaigns')}
                />
              )}

              {currentTab === 'new_campaign' && (
                <NewCampaignPage
                  user={user}
                  onConnectGmail={handleConnectGmail}
                  onStartCampaign={handleStartCampaign}
                  initialTemplate={initialNewCampaignTemplate}
                  importedEmailsFromVagas={importedEmailsFromVagas}
                />
              )}

              {currentTab === 'campaigns' && (
                <CampaignsHistoryPage
                  campaigns={campaigns}
                  onSelectCampaign={() => {}}
                  onDeleteCampaign={handleDeleteCampaign}
                  onNewCampaign={() => setCurrentTab('new_campaign')}
                />
              )}

              {currentTab === 'templates' && (
                <TemplatesPage
                  templates={templates}
                  onTemplatesUpdated={setTemplates}
                  onUseTemplate={handleUseTemplate}
                />
              )}

              {currentTab === 'vagas_finder' && (
                <VagasSearchPage
                  onSendToCampaign={handleTransferVagasEmailsToCampaign}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  user={user}
                  onConnectGmail={handleConnectGmail}
                  onDisconnectGmail={handleDisconnectGmail}
                />
              )}

              {currentTab === 'privacy' && (
                <PrivacyPage
                  onDataCleared={() => {
                    setCampaigns([]);
                    setTemplates(getTemplates());
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur px-2 py-2 flex items-center justify-around z-30">
        <button
          onClick={() => {
            setActiveCampaign(null);
            setCurrentTab('dashboard');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
            currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Início</span>
        </button>
        <button
          onClick={() => {
            setActiveCampaign(null);
            setCurrentTab('new_campaign');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
            currentTab === 'new_campaign' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <MailPlus className="w-4 h-4" />
          <span>Nova</span>
        </button>
        <button
          onClick={() => {
            setActiveCampaign(null);
            setCurrentTab('vagas_finder');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
            currentTab === 'vagas_finder' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Vagas</span>
        </button>
        <button
          onClick={() => {
            setActiveCampaign(null);
            setCurrentTab('campaigns');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
            currentTab === 'campaigns' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Campanhas</span>
        </button>
        <button
          onClick={() => {
            setActiveCampaign(null);
            setCurrentTab('templates');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
            currentTab === 'templates' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Modelos</span>
        </button>
        <button
          onClick={() => {
            setActiveCampaign(null);
            setCurrentTab('settings');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
            currentTab === 'settings' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Ajustes</span>
        </button>
      </nav>
    </div>
  );
}
