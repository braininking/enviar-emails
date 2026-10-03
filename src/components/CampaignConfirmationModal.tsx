import React, { useState } from 'react';
import { CheckCircle2, ArrowLeft, Send, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AttachmentFile, Recipient, DuplicateDetail } from '../types';
import { personalizeText } from '../services/gmailService';
import { formatFileSize } from '../services/fileService';

interface CampaignConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSend: (sendMode: 'unique_only' | 'all_occurrences') => void;
  senderEmail: string;
  subject: string;
  message: string;
  recipients: Recipient[];
  attachments: AttachmentFile[];
  totalImported: number;
  uniqueCount: number;
  duplicateCount: number;
  duplicatesList: DuplicateDetail[];
}

export const CampaignConfirmationModal: React.FC<CampaignConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmSend,
  senderEmail,
  subject,
  message,
  recipients,
  attachments,
  totalImported,
  uniqueCount,
  duplicateCount,
  duplicatesList,
}) => {
  // Default: send once per address if duplicates exist, as requested in spec
  const [duplicateStrategy, setDuplicateStrategy] = useState<'unique_only' | 'all_occurrences'>('unique_only');

  if (!isOpen) return null;

  const sampleRecipient = recipients[0] || {
    email: 'exemplo@empresa.com.br',
    company: 'Empresa Exemplo',
    role: 'Vaga Desejada',
    name: 'Recrutador',
  };

  const previewSubject = personalizeText(subject, sampleRecipient);
  const previewBody = personalizeText(message, sampleRecipient);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Confirmar Envio da Campanha</h3>
              <p className="text-xs text-slate-400">Revise os destinatários e escolha como tratar endereços duplicados</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-xl space-y-1">
              <span className="text-slate-400 block font-medium">Registros importados:</span>
              <span className="font-bold text-white text-base block">{totalImported}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-xl space-y-1">
              <span className="text-slate-400 block font-medium">Endereços únicos:</span>
              <span className="font-bold text-emerald-400 text-base block">{uniqueCount}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-xl space-y-1">
              <span className="text-slate-400 block font-medium">Duplicados:</span>
              <span className="font-bold text-amber-400 text-base block">{duplicateCount}</span>
            </div>
          </div>

          {/* DUPLICATE STRATEGY PROMPT */}
          {duplicateCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Existem endereços duplicados. Como deseja proceder?
                  </h4>
                  <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                    Sua lista original continuará 100% preservada na tela e nos seus registros. Escolha apenas como a fila de envio deve tratar as repetições.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label
                  onClick={() => setDuplicateStrategy('unique_only')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    duplicateStrategy === 'unique_only'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="dupStrategy"
                    checked={duplicateStrategy === 'unique_only'}
                    onChange={() => setDuplicateStrategy('unique_only')}
                    className="mt-1 text-blue-500"
                  />
                  <div>
                    <span className="text-xs font-semibold block">Enviar somente uma vez para cada endereço</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Recomendado – Dispara para {uniqueCount} destinatários distintos sem repetir envios.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setDuplicateStrategy('all_occurrences')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    duplicateStrategy === 'all_occurrences'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="dupStrategy"
                    checked={duplicateStrategy === 'all_occurrences'}
                    onChange={() => setDuplicateStrategy('all_occurrences')}
                    className="mt-1 text-blue-500"
                  />
                  <div>
                    <span className="text-xs font-semibold block">Enviar todas as ocorrências</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Dispara {totalImported} e-mails incluindo mensagens repetidas para os mesmos endereços.
                    </span>
                  </div>
                </label>
              </div>

              {/* Duplicate emails list preview */}
              {duplicatesList.length > 0 && (
                <div className="text-[11px] text-amber-300/80 pt-1">
                  <strong>Ocorrências repetidas: </strong>
                  {duplicatesList.map((d) => `• ${d.email} (${d.count}x)`).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Details Bar */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div>
              <span className="text-slate-400">Remetente: </span>
              <span className="text-emerald-400 font-mono font-medium">{senderEmail}</span>
            </div>
            <div>
              <span className="text-slate-400">Assunto: </span>
              <span className="text-white font-medium">{subject}</span>
            </div>
            <div>
              <span className="text-slate-400">Anexos: </span>
              {attachments.length > 0 ? (
                <span className="text-blue-400 font-medium">
                  {attachments.map((a) => `${a.filename} (${formatFileSize(a.size)})`).join(', ')}
                </span>
              ) : (
                <span className="text-slate-500 italic">Nenhum anexo adicionado</span>
              )}
            </div>
          </div>

          {/* Preview of personalized message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">
                Prévia da mensagem (simulação para 1º destinatário):
              </span>
              <span className="text-[11px] text-slate-500">
                Para: {sampleRecipient.email}
              </span>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-300 font-sans whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed border-l-2 border-l-blue-500">
              <p className="font-semibold text-slate-200 mb-2">Assunto: {previewSubject}</p>
              {previewBody}
            </div>
          </div>

          {/* Compliance notice */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <p className="leading-relaxed">
              Cada destinatário receberá sua própria mensagem individualmente com intervalos controlados via API oficial do Gmail.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button
            type="button"
            onClick={() => onConfirmSend(duplicateStrategy)}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {duplicateStrategy === 'unique_only' && duplicateCount > 0
              ? `Enviar para ${uniqueCount} endereços únicos`
              : `Enviar todas as ${totalImported} ocorrências`}
          </button>
        </div>
      </div>
    </div>
  );
};
