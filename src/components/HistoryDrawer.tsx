import React from 'react';
import { History, X, Clock, MapPin, Mail, Layers, ChevronRight, Trash2, Briefcase } from 'lucide-react';
import { SearchHistoryItem } from '../types/job';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectHistoryItem: (item: SearchHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Histórico de Pesquisas</h3>
                <p className="text-xs text-slate-400">Consultas realizadas nesta sessão</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Nenhuma pesquisa realizada ainda.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Suas buscas recentes aparecerão aqui com a contagem de contatos e e-mails únicos.
                </p>
              </div>
            ) : (
              history.map((item) => {
                const totalContacts = item.allContacts?.length || item.stats.emailsFound || 0;
                const totalUnique = item.uniqueEmails?.length || item.stats.emailsUnique || 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 cursor-pointer transition-all group flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {item.term}
                      </span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {item.selectedCities && item.selectedCities.length > 0
                          ? item.selectedCities.join(', ')
                          : item.location || 'Todas as cidades'}
                      </span>
                    </div>

                    {/* Stats pills according to user prompt format */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="px-2.5 py-1.5 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs">
                        <div className="text-[10px] text-slate-400">Total ocorrências</div>
                        <div className="text-sky-300 font-bold">{totalContacts} contatos</div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs">
                        <div className="text-[10px] text-slate-400">Deduplicados</div>
                        <div className="text-emerald-300 font-bold">{totalUnique} únicos</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {item.stats.jobsAnalyzed} vagas analisadas
                      </span>
                      <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs font-medium">
                        Restaurar
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {history.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={onClearHistory}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico da Sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
