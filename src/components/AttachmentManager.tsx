import React, { useRef, useState } from 'react';
import { Paperclip, FileText, Trash2, Plus, AlertCircle } from 'lucide-react';
import { AttachmentFile } from '../types';
import { processAttachmentFile, formatFileSize } from '../services/fileService';

interface AttachmentManagerProps {
  attachments: AttachmentFile[];
  onAddAttachment: (attachment: AttachmentFile) => void;
  onRemoveAttachment: (id: string) => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const att = await processAttachmentFile(file);
        onAddAttachment(att);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalSize = attachments.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-blue-400" />
          Anexos da Candidatura
        </label>
        <span className="text-[11px] text-slate-500">
          Total: {formatFileSize(totalSize)} / Máx 15 MB
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* List of Attachments */}
      <div className="space-y-2">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{att.filename}</p>
                <p className="text-[10px] text-slate-500">{formatFileSize(att.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveAttachment(att.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Remover anexo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl bg-slate-900/40 hover:bg-blue-500/5 text-xs font-medium text-slate-300 hover:text-blue-400 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {isProcessing ? 'Processando arquivo...' : 'Adicionar arquivo (ex: currículo.pdf, certificados)'}
        </button>
      </div>
    </div>
  );
};
