import React from 'react';
import { Loader2, Square, Mail, Briefcase, CheckCircle2, AtSign, Layers } from 'lucide-react';
import { SearchStats, JobVacancy } from '../types/job';

interface ProgressTrackerProps {
  isSearching: boolean;
  stats: SearchStats;
  message: string;
  currentJob?: JobVacancy;
  onStop: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  isSearching,
  stats,
  message,
  currentJob,
  onStop,
}) => {
  if (!isSearching) return null;

  // Approximate percentage calculation
  const totalTarget = stats.totalPages > 0 ? stats.totalPages * 16 : 16;
  const progressPercent = Math.min(
    98,
    Math.max(5, Math.round((stats.jobsAnalyzed / (totalTarget || 1)) * 100))
  );

  return (
    <div className="w-full mt-6 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl shadow-cyan-950/30 ring-1 ring-cyan-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status & Current Page */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pesquisando vagas...
            </h3>
            {stats.totalPages > 0 && stats.currentPage > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Página {stats.currentPage} de {stats.totalPages}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 truncate max-w-xl">
            {message || 'Buscando publicações recentes no Themos Vagas...'}
          </p>
        </div>

        {/* Right: Stop button */}
        <button
          type="button"
          onClick={onStop}
          className="self-start md:self-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>⏹ PARAR PESQUISA</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Live Mini Counters matching user definitive rules */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 text-center">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
          <div className="text-[11px] text-slate-400 font-medium">Vagas encontradas</div>
          <div className="text-lg font-bold text-slate-100">{stats.jobsFound}</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
          <div className="text-[11px] text-cyan-400 font-medium">Vagas analisadas</div>
          <div className="text-lg font-bold text-cyan-300">{stats.jobsAnalyzed}</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
          <div className="text-[11px] text-emerald-400 font-medium">Vagas com e-mail</div>
          <div className="text-lg font-bold text-emerald-300">{stats.jobsWithEmail}</div>
        </div>

        <div className="bg-slate-950/60 border border-sky-500/20 rounded-xl p-2.5">
          <div className="text-[11px] text-sky-400 font-medium">Contatos encontrados</div>
          <div className="text-lg font-bold text-sky-300">{stats.emailsFound}</div>
        </div>

        <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-2.5 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-emerald-400 font-bold">E-mails únicos</div>
          <div className="text-lg font-black text-emerald-300">{stats.emailsUnique}</div>
        </div>
      </div>

      {/* Live inspection indicator */}
      {currentJob && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400 truncate">
          <span className="shrink-0 text-slate-500 font-medium">Analisando agora:</span>
          <span className="text-slate-200 truncate font-mono">{currentJob.title}</span>
          {currentJob.hasEmail && (
            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              <Mail className="w-2.5 h-2.5" />
              {currentJob.emails.length} contato(s)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
