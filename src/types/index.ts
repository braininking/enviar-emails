export interface Recipient {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  isValid?: boolean;
  isDuplicate?: boolean;
  duplicateCount?: number;
  error?: string;
  sentAt?: string;
}

export interface AttachmentFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  dataBase64?: string; // base64 without prefix for MIME building
}

export interface EmailTemplate {
  id: string;
  userId?: string;
  name: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Campaign {
  id: string;
  userId?: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'draft' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  recipients: Recipient[];
  attachments: AttachmentFile[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  createdAt: string;
  completedAt?: string;
  lastActiveIndex?: number;
}

export interface DuplicateDetail {
  email: string;
  count: number;
}

export interface EmailValidationSummary {
  total: number; // Registros encontrados
  uniqueCount: number; // Endereços únicos
  valid: number; // Registros com formato válido (inclui duplicados preservados)
  duplicateCount: number; // Quantidade de registros duplicados
  invalid: number; // Registros inválidos
  list: Recipient[]; // Lista completa ORIGINAL com status
  duplicatesList: DuplicateDetail[]; // Lista de emails duplicados e quantidade
  invalidList: Recipient[]; // Lista de itens inválidos
}

export interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export * from './job';
