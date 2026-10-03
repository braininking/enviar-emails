import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Send,
  AlertCircle,
  FileText,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { AttachmentFile, Recipient, UserProfile, EmailTemplate, EmailValidationSummary } from '../types';
import { RichTextEditor } from '../components/RichTextEditor';
import { AttachmentManager } from '../components/AttachmentManager';
import { FileImportModal } from '../components/FileImportModal';
import { TestEmailModal } from '../components/TestEmailModal';
import { CampaignConfirmationModal } from '../components/CampaignConfirmationModal';
import { parsePastedEmails } from '../services/contactService';
import { getTemplates } from '../services/templateService';
import { createMimeMessage, sendGmailMessage, personalizeText } from '../services/gmailService';

interface NewCampaignPageProps {
  user: UserProfile | null;
  onConnectGmail: () => void;
  onStartCampaign: (params: {
    senderEmail: string;
    subject: string;
    message: string;
    recipients: Recipient[];
    attachments: AttachmentFile[];
  }) => void;
  initialTemplate?: EmailTemplate | null;
  importedEmailsFromVagas?: string[];
}

export const NewCampaignPage: React.FC<NewCampaignPageProps> = ({
  user,
  onConnectGmail,
  onStartCampaign,
  initialTemplate,
  importedEmailsFromVagas,
}) => {
  // Area 2: Assunto
  const [subject, setSubject] = useState(
    initialTemplate?.subject || 'Candidatura - Técnico de Informática'
  );

  // Area 3: Mensagem
  const [message, setMessage] = useState(
    initialTemplate?.message ||
      `Olá, equipe da {{empresa}},\n\nEstou encaminhando meu currículo para avaliação para a oportunidade de {{cargo}} ou posições afins.\n\nFico à disposição para uma entrevista e agradeço desde já a oportunidade.\n\nAtenciosamente,\n{{nome}}`
  );

  // Area 4: Destinatários - preserves exact text entered
  const [rawPastedEmails, setRawPastedEmails] = useState(
    importedEmailsFromVagas && importedEmailsFromVagas.length > 0
      ? importedEmailsFromVagas.join('\n')
      : 'rh@empresa1.com.br\nvagas@empresa2.com.br\nrecrutamento@empresa3.com.br'
  );

  const [validationSummary, setValidationSummary] = useState<EmailValidationSummary>({
    total: 0,
    uniqueCount: 0,
    valid: 0,
    duplicateCount: 0,
    invalid: 0,
    list: [],
    duplicatesList: [],
    invalidList: [],
  });

  // Area 10: Anexos
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Templates dropdown
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Status & warnings
  const [uiError, setUiError] = useState<string | null>(null);

  // Parse pasted text on mount & whenever rawPastedEmails changes - NEVER drops any item
  useEffect(() => {
    const summary = parsePastedEmails(rawPastedEmails);
    setValidationSummary(summary);
  }, [rawPastedEmails]);

  // Load available templates
  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  useEffect(() => {
    if (importedEmailsFromVagas && importedEmailsFromVagas.length > 0) {
      setRawPastedEmails(importedEmailsFromVagas.join('\n'));
    }
  }, [importedEmailsFromVagas]);

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = templates.find((t) => t.id === templateId);
    if (found) {
      setSubject(found.subject);
      setMessage(found.message);
    }
  };

  // Confirm Excel Import: APPENDS ALL rows without dropping duplicates or invalid entries
  const handleConfirmExcelImport = (importedList: Recipient[]) => {
    const importedLines: string[] = [];
    for (let i = 0; i < importedList.length; i++) {
      const r = importedList[i];
      if (r.company || r.role || r.name) {
        importedLines.push(`${r.email} (${[r.company, r.role, r.name].filter(Boolean).join(' - ')})`);
      } else {
        importedLines.push(r.email);
      }
    }
    const currentText = rawPastedEmails.trim();
    const newText = currentText.length > 0
      ? `${currentText}\n${importedLines.join('\n')}`
      : importedLines.join('\n');
    setRawPastedEmails(newText);
  };

  const handleClearRecipients = () => {
    setRawPastedEmails('');
    setValidationSummary({
      total: 0,
      uniqueCount: 0,
      valid: 0,
      duplicateCount: 0,
      invalid: 0,
      list: [],
      duplicatesList: [],
      invalidList: [],
    });
  };

  const handleAddAttachment = (att: AttachmentFile) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Enviar e-mail de teste
  const handleSendTestEmail = async (targetEmail: string) => {
    const sender = user?.email || 'usuario@gmail.com';
    const testRecipient: Partial<Recipient> = {
      email: targetEmail,
      name: user?.name || 'Candidato',
      company: 'Empresa Teste',
      role: 'Técnico de Informática',
    };
    const personalizedSubj = `[TESTE] ${personalizeText(subject, testRecipient)}`;
    const personalizedBody = personalizeText(message, testRecipient);
    const rawBase64Url = createMimeMessage({
      to: targetEmail,
      from: sender,
      subject: personalizedSubj,
      bodyPlain: personalizedBody,
      bodyHtml: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
        <p style="background: #e0f2fe; color: #0369a1; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
          ℹ️ Este é um e-mail de teste disparado pelo <strong>Currículo Mail</strong> para validação de layout e anexos.
        </p>
        <div style="white-space: pre-wrap; font-size: 14px; margin-top: 16px;">${personalizedBody}</div>
      </div>`,
      attachments,
    });

    if (token) {
      await sendGmailMessage({ accessToken: token, rawBase64Url });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  };

  const handleValidateAndOpenConfirmation = () => {
    setUiError(null);
    if (!user) {
      setUiError('Conecte sua conta do Gmail antes de enviar a campanha.');
      return;
    }
    if (!subject.trim()) {
      setUiError('Por favor, informe o assunto do e-mail.');
      return;
    }
    if (!message.trim()) {
      setUiError('Por favor, escreva a mensagem do e-mail.');
      return;
    }
    if (validationSummary.list.length === 0) {
      setUiError('Adicione pelo menos um e-mail na lista de destinatários.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Execution confirmed with user's selected duplicate strategy
  const handleExecuteStart = (sendMode: 'unique_only' | 'all_occurrences') => {
    setIsConfirmModalOpen(false);

    // Filter valid emails for sending queue (invalid format cannot be sent via SMTP/Gmail)
    const validRecipientsOnly: Recipient[] = [];
    const seenMap: { [email: string]: boolean } = {};

    for (let i = 0; i < validationSummary.list.length; i++) {
      const item = validationSummary.list[i];
      if (!item.isValid) continue;

      if (sendMode === 'unique_only') {
        const normalized = item.email.toLowerCase();
        if (!seenMap[normalized]) {
          seenMap[normalized] = true;
          validRecipientsOnly.push(item);
        }
      } else {
        // 'all_occurrences' - sends every single occurrence
        validRecipientsOnly.push(item);
      }
    }

    onStartCampaign({
      senderEmail: user?.email || 'usuario@gmail.com',
      subject,
      message,
      recipients: validRecipientsOnly,
      attachments,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Nova Campanha de Candidatura</h2>
          <p className="text-xs text-slate-400">
            Configure o remetente, assunto, mensagem personalizada e lista de empresas destinatárias.
          </p>
        </div>

        {/* Template Selector Quick Dropdown */}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400">Usar Modelo:</span>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleApplyTemplate(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Selecionar modelo pré-pronto...</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {uiError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uiError}</span>
        </div>
      )}

      {/* ÁREA 1 – REMETENTE */}
      <section className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Área 1 – Remetente
            </span>
          </div>
          {user ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Conta autorizada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Não autorizada
            </span>
          )}
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Gmail remetente do disparo:</span>
            {user ? (
              <span className="text-sm font-bold text-white font-mono">{user.email}</span>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Nenhuma conta Gmail conectada no momento
              </span>
            )}
          </div>
          <div>
            {user ? (
              <button
                type="button"
                onClick={onConnectGmail}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Alternar conta Gmail
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectGmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Conectar Gmail (OAuth 2.0)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ÁREA 2 – ASSUNTO */}
      <section className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Área 2 – Assunto do E-mail
        </label>
        <div className="relative">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Candidatura - Técnico de Informática"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Dica: Você também pode usar variáveis no assunto, como: <code>Candidatura para vaga de {'{{cargo}}'} - {'{{empresa}}'}</code>
        </p>
      </section>

      {/* ÁREA 3 – MENSAGEM */}
      <section className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Área 3 – Mensagem
          </label>
          <span className="text-[11px] text-slate-500">
            Suporta texto com variáveis inteligentes
          </span>
        </div>
        <RichTextEditor
          value={message}
          onChange={setMessage}
          placeholder="Olá, equipe de recrutamento..."
        />
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
          <p>
            Variáveis disponíveis:{' '}
            <code className="text-blue-400">{`{{nome}}`}</code>,{' '}
            <code className="text-indigo-400">{`{{empresa}}`}</code>,{' '}
            <code className="text-emerald-400">{`{{cargo}}`}</code>,{' '}
            <code className="text-amber-400">{`{{email}}`}</code>. Se os dados não existirem para algum destinatário, o sistema preencherá suavemente sem quebrar o texto.
          </p>
        </div>
      </section>

      {/* ÁREA 4 – DESTINATÁRIOS */}
      <section className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Área 4 – Destinatários
            </label>
            <p className="text-xs text-slate-400 mt-0.5">
              Cole os endereços de e-mail, um por linha, separados por vírgula ou ponto e vírgula. Todos os registros são mantidos na lista.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Importar Excel/CSV
            </button>
            <button
              type="button"
              onClick={handleClearRecipients}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs font-medium transition-colors cursor-pointer"
            >
              Limpar lista
            </button>
          </div>
        </div>

        <textarea
          rows={6}
          value={rawPastedEmails}
          onChange={(e) => setRawPastedEmails(e.target.value)}
          placeholder={`rh@empresa.com.br\nrecrutamento@empresa2.com.br\nvagas@empresa3.com.br`}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        />

        {/* Status badges bar - Exact numbers requested: Encontrados, Válidos, Duplicados, Inválidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Encontrados</span>
            <span className="text-base font-bold text-white">
              {validationSummary.total}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
            <span className="text-[11px] text-emerald-400 block">Válidos</span>
            <span className="text-base font-bold text-emerald-300">
              {validationSummary.valid}
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              ({validationSummary.uniqueCount} únicos)
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
            <span className="text-[11px] text-amber-400 block">Duplicados</span>
            <span className="text-base font-bold text-amber-300">
              {validationSummary.duplicateCount}
            </span>
            <span className="text-[10px] text-amber-400/80 block mt-0.5">
              identificados
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center">
            <span className="text-[11px] text-rose-400 block">Inválidos</span>
            <span className="text-base font-bold text-rose-300">
              {validationSummary.invalid}
            </span>
            <span className="text-[10px] text-rose-400/80 block mt-0.5">
              mantidos na lista
            </span>
          </div>
        </div>

        {/* DUPLICATE WARNINGS LIST WITH OCCURRENCES */}
        {validationSummary.duplicatesList.length > 0 && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Endereços duplicados identificados na lista (todos foram preservados):</span>
            </div>
            <div className="space-y-1 pl-6">
              {validationSummary.duplicatesList.map((dup, idx) => (
                <div key={idx} className="text-amber-200/90 font-mono text-xs flex items-center gap-2">
                  <span>•</span>
                  <span className="font-semibold text-white">{dup.email}</span>
                  <span className="text-amber-400 font-sans">→ aparece {dup.count} vezes</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVALID WARNINGS LIST (KEPT IN LIST, NOT REMOVED) */}
        {validationSummary.invalidList.length > 0 && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Registros com formato inválido (mantidos na lista):</span>
            </div>
            <div className="space-y-1 pl-6">
              {validationSummary.invalidList.map((inv, idx) => (
                <div key={idx} className="text-rose-200/90 font-mono text-xs flex items-center gap-2">
                  <span>•</span>
                  <span className="font-semibold text-white">{inv.email}</span>
                  <span className="text-rose-400 font-sans">→ formato de e-mail inválido</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ÁREA 10 – ANEXOS */}
      <section className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <AttachmentManager
          attachments={attachments}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
        />
      </section>

      {/* ACTION BAR */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 shadow-2xl z-20">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          Registros na lista: <strong className="text-white font-bold">{validationSummary.total}</strong> •{' '}
          Únicos: <strong className="text-emerald-400 font-bold">{validationSummary.uniqueCount}</strong>
          {validationSummary.duplicateCount > 0 && (
            <span className="text-amber-400 ml-1">
              ({validationSummary.duplicateCount} duplicados)
            </span>
          )}{' '}
          • <strong className="text-blue-400">{attachments.length}</strong> anexo(s)
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* ÁREA 11 – TESTE DE E-MAIL */}
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Enviar e-mail de teste
          </button>
          {/* ÁREA 12 – CONFIRMAÇÃO DA CAMPANHA */}
          <button
            type="button"
            onClick={handleValidateAndOpenConfirmation}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Send className="w-4 h-4" /> Avançar para Confirmação
          </button>
        </div>
      </div>

      {/* Modals */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleConfirmExcelImport}
      />
      <TestEmailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSendTest={handleSendTestEmail}
        subject={subject}
        attachments={attachments}
      />
      <CampaignConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirmSend={handleExecuteStart}
        senderEmail={user?.email || 'usuario@gmail.com'}
        subject={subject}
        message={message}
        recipients={validationSummary.list}
        attachments={attachments}
        totalImported={validationSummary.total}
        uniqueCount={validationSummary.uniqueCount}
        duplicateCount={validationSummary.duplicateCount}
        duplicatesList={validationSummary.duplicatesList}
      />
    </div>
  );
};
