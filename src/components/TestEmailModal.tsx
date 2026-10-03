import React, { useState } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle } from 'lucide-react';
import { AttachmentFile } from '../types';
import { isValidEmail } from '../services/contactService';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTest: (targetEmail: string) => Promise<void>;
  subject: string;
  attachments: AttachmentFile[];
}

export const TestEmailModal: React.FC<TestEmailModalProps> = ({
  isOpen,
  onClose,
  onSendTest,
  subject,
  attachments,
}) => {
  const [targetEmail, setTargetEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(targetEmail)) {
      setError('Por favor, informe um endereço de e-mail válido para teste.');
      return;
    }
    setError(null);
    setIsSending(true);

    try {
      await onSendTest(targetEmail.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar e-mail de teste.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Enviar E-mail de Teste</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Envie uma mensagem de teste para sua própria caixa postal para verificar formatação, variáveis e anexos antes de disparar a campanha.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Digite o e-mail para teste
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="seu-email@gmail.com"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div><strong>Assunto:</strong> {subject || '(Sem assunto)'}</div>
            <div><strong>Anexos inclusos:</strong> {attachments.length} arquivo(s)</div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Teste enviado com sucesso! Verifique sua caixa de entrada.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending || success}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'Enviando teste...' : 'Enviar teste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
