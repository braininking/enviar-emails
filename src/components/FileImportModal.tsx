import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, Check, AlertTriangle, Table } from 'lucide-react';
import { parseExcelOrCsvFile } from '../services/contactService';
import { EmailValidationSummary, Recipient } from '../types';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (recipients: Recipient[]) => void;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({ isOpen, onClose, onConfirmImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewSummary, setPreviewSummary] = useState<EmailValidationSummary | null>(null);
  const [rowsPreview, setRowsPreview] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsParsing(true);
    setFileName(file.name);

    try {
      const result = await parseExcelOrCsvFile(file);
      setPreviewSummary(result.summary);
      setRowsPreview(result.rowsPreview);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar arquivo.');
      setPreviewSummary(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    if (previewSummary && previewSummary.list.length > 0) {
      // PRESERVE ALL ROWS - never delete duplicates or items
      onConfirmImport(previewSummary.list);
      handleClose();
    }
  };

  const handleClose = () => {
    setFileName(null);
    setError(null);
    setPreviewSummary(null);
    setRowsPreview([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Importar Lista (Excel / CSV)</h3>
              <p className="text-xs text-slate-400">Todos os registros são mantidos integralmente</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/40 hover:bg-blue-500/5 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-blue-600/20 text-slate-300 group-hover:text-blue-400 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {fileName ? fileName : 'Clique para selecionar ou arraste o arquivo aqui'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Suporta planilhas com colunas: <strong>Empresa, E-mail, Cargo, Nome</strong> ou apenas uma coluna de e-mails
              </p>
            </div>
          </div>

          {isParsing && (
            <div className="text-center py-6 text-slate-400 text-sm animate-pulse">
              Processando planilha e identificando registros...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Validation Summary */}
          {previewSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-xs text-slate-400 block">Encontrados</span>
                  <span className="text-lg font-bold text-slate-100">{previewSummary.total}</span>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <span className="text-xs text-emerald-400 block">Válidos</span>
                  <span className="text-lg font-bold text-emerald-300">{previewSummary.valid}</span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                  <span className="text-xs text-amber-400 block">Duplicados</span>
                  <span className="text-lg font-bold text-amber-300">{previewSummary.duplicateCount}</span>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                  <span className="text-xs text-rose-400 block">Inválidos</span>
                  <span className="text-lg font-bold text-rose-300">{previewSummary.invalid}</span>
                </div>
              </div>

              {previewSummary.duplicateCount > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Endereços duplicados identificados (todas as linhas serão mantidas):
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {previewSummary.duplicatesList.slice(0, 10).map((dup, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/20 font-mono text-[11px]">
                        {dup.email} ({dup.count}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-blue-400" /> Prévia dos Dados (todos os registros preservados)
                  </span>
                  <span className="text-xs text-slate-500">Exibindo primeiros {rowsPreview.length} registros</span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950 max-h-56">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Empresa</th>
                        <th className="py-2.5 px-3">E-mail</th>
                        <th className="py-2.5 px-3">Cargo</th>
                        <th className="py-2.5 px-3">Nome</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {rowsPreview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 text-slate-200">{row.empresa || '-'}</td>
                          <td className="py-2 px-3 font-mono text-slate-300">{row.email}</td>
                          <td className="py-2 px-3 text-slate-400">{row.cargo || '-'}</td>
                          <td className="py-2 px-3 text-slate-400">{row.nome || '-'}</td>
                          <td className="py-2 px-3">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <Check className="w-3.5 h-3.5" /> Válido
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                Duplicado ({row.occurrences}x)
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span className="inline-flex items-center gap-1 text-rose-400">
                                Inválido
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!previewSummary || previewSummary.list.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Importar todos os {previewSummary?.total || 0} registros
          </button>
        </div>
      </div>
    </div>
  );
};
