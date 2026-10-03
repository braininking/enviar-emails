import { Campaign, Recipient, AttachmentFile } from '../types';

const CAMPAIGNS_STORAGE_KEY = 'curriculo_mail_campaigns';
const ACTIVE_CAMPAIGN_KEY = 'curriculo_mail_active_interrupted';

/**
 * Strips heavy dataBase64 from attachments before persisting to localStorage
 * to prevent exceeding browser quota (5MB limit).
 */
export function sanitizeCampaignForStorage(campaign: Campaign): Campaign {
  return {
    ...campaign,
    attachments: (campaign.attachments || []).map((att) => ({
      id: att.id,
      filename: att.filename,
      mimeType: att.mimeType,
      size: att.size,
      // Omit dataBase64 to save MBs in localStorage quota
    })),
  };
}

export const INITIAL_DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_demo_1',
    senderEmail: 'candidato.demo@gmail.com',
    subject: 'Candidatura - Técnico de Informática',
    message: 'Olá, equipe de recrutamento.\nEstou encaminhando meu currículo para avaliação.',
    status: 'completed',
    recipients: [
      { id: '1', email: 'rh@empresa1.com.br', company: 'Empresa Alpha', status: 'sent', sentAt: '2026-09-28T09:31:00Z' },
      { id: '2', email: 'vagas@empresa2.com.br', company: 'Tech Beta', status: 'sent', sentAt: '2026-09-28T09:32:00Z' },
      { id: '3', email: 'recrutamento@empresa3.com.br', company: 'Gama Soluções', status: 'failed', error: 'Endereço inexistente (550 User not found)', sentAt: '2026-09-28T09:33:00Z' },
      { id: '4', email: 'selecao@empresa4.com.br', company: 'Delta TI', status: 'sent', sentAt: '2026-09-28T09:34:00Z' },
    ],
    attachments: [
      { id: 'att_demo_1', filename: 'curriculo_wandeson_ti.pdf', mimeType: 'application/pdf', size: 1258291 },
    ],
    totalRecipients: 4,
    sentCount: 3,
    failedCount: 1,
    pendingCount: 0,
    createdAt: '2026-09-28T09:30:00Z',
    completedAt: '2026-09-28T09:35:00Z',
  },
];

export function getCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (!raw) {
      try {
        localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_CAMPAIGNS));
      } catch (err) {
        console.warn('Não foi possível inicializar campanhas demo no localStorage:', err);
      }
      return INITIAL_DEMO_CAMPAIGNS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler campanhas do localStorage:', e);
    return INITIAL_DEMO_CAMPAIGNS;
  }
}

export function saveCampaign(campaign: Campaign): void {
  try {
    const campaigns = getCampaigns();
    const sanitized = sanitizeCampaignForStorage(campaign);
    const index = campaigns.findIndex((c) => c.id === campaign.id);
    if (index !== -1) {
      campaigns[index] = sanitized;
    } else {
      campaigns.unshift(sanitized);
    }
    // Keep at most 25 latest campaigns in storage to avoid quota overflow
    const trimmedCampaigns = campaigns.slice(0, 25);
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(trimmedCampaigns));
  } catch (err) {
    console.warn('Aviso: Falha ao salvar histórico de campanhas no localStorage (cota excedida):', err);
    try {
      // Emergency recovery: trim older items and retry
      const campaigns = getCampaigns().slice(0, 5);
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    } catch {
      // Ignore if browser still rejects
    }
  }
}

export function deleteCampaign(id: string): void {
  try {
    const campaigns = getCampaigns();
    const filtered = campaigns.filter((c) => c.id !== id);
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Erro ao remover campanha do localStorage:', err);
  }
}

export function saveInterruptedCampaign(campaign: Campaign): void {
  try {
    const sanitized = sanitizeCampaignForStorage(campaign);
    localStorage.setItem(ACTIVE_CAMPAIGN_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.warn('Aviso: Cota do localStorage atingida ao salvar progresso da campanha:', err);
  }
}

export function getInterruptedCampaign(): Campaign | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearInterruptedCampaign(): void {
  try {
    localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
  } catch (err) {
    console.warn('Erro ao limpar campanha interrompida:', err);
  }
}

export function clearAllLocalData(): void {
  try {
    localStorage.removeItem(CAMPAIGNS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    localStorage.removeItem('curriculo_mail_templates');
  } catch (err) {
    console.warn('Erro ao limpar dados locais:', err);
  }
}

export function getDashboardStats() {
  const campaigns = getCampaigns();
  let totalSent = 0;
  let totalErrors = 0;
  for (const c of campaigns) {
    totalSent += c.sentCount || 0;
    totalErrors += c.failedCount || 0;
  }
  const lastCampaign = campaigns.length > 0 ? campaigns[0] : null;
  return {
    totalSent,
    totalErrors,
    campaignsCount: campaigns.length,
    lastCampaign,
  };
}
