import React from 'react';
import {
  Copy,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Mail,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  AtSign,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SearchStats } from '../types/job';

interface StatsOverviewProps {
  stats: SearchStats;
  totalUniqueEmails: number;
  totalAllContacts: number;
  onCopyUniqueEmails: () => void;
  onCopyAllContacts: () => void;
  onExportCsv: () => void;
  onCopyResults: () => void;
  onNewSearch: () => void;
  viewMode: 'cards' | 'unique_emails' | 'table';
  onViewModeChange: (mode: 'cards' | 'unique_emails' | 'table') => void;
  isSearching: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  totalUniqueEmails,
  totalAllContacts,
  onCopyUniqueEmails,
  onCopyAllContacts,
  onExportCsv,
  onCopyResults,
  onNewSearch,
  viewMode,
  onViewModeChange,
  isSearching,
}) => {
  return (
    <div className="w-full mt-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
      {/* Top Bar with Status and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isSearching ? 'Pesquisando no Themos Vagas...' : 'Resultados da Pesquisa'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dados públicos extraídos em tempo real • Todas as ocorrências preservadas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* BOTÃO PRINCIPAL: COPIAR E-MAILS ÚNICOS */}
          <button
            onClick={onCopyUniqueEmails}
            disabled={totalUniqueEmails === 0}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Copiar apenas os e-mails únicos sem repetição (Recomendado para envio)"
          >
            <Copy className="w-4 h-4 stroke-[2.5]" />
            <span>📋 COPIAR E-MAILS ÚNICOS ({totalUniqueEmails})</span>
          </button>

          {/* SEGUNDO BOTÃO: COPIAR TODOS OS CONTATOS */}
          <button
            onClick={onCopyAllContacts}
            disabled={totalAllContacts === 0}
            className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Copiar todas as ocorrências encontradas, incluindo repetições"
          >
            <Copy className="w-4 h-4 text-cyan-400" />
            <span>📋 COPIAR TODOS OS CONTATOS ({totalAllContacts})</span>
          </button>

          {/* EXPORTAR CSV */}
          <button
            onClick={onExportCsv}
            disabled={stats.jobsAnalyzed === 0}
            className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Exportar lista completa para CSV (sem deduplicar)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>📥 EXPORTAR CSV</span>
          </button>

          {/* COPIAR RESULTADOS */}
          <button
            onClick={onCopyResults}
            disabled={stats.jobsAnalyzed === 0}
            className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Copiar resumo estruturado das vagas para texto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">📋 COPIAR RESULTADOS</span>
            <span className="sm:hidden">Copiar</span>
          </button>

          {/* NOVA PESQUISA */}
          <button
            onClick={onNewSearch}
            className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            title="Limpar e iniciar nova pesquisa"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>🔄 NOVA PESQUISA</span>
          </button>
        </div>
      </div>

      {/* Metrics Row Exactly as Requested */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-5">
        {/* 1. Vagas encontradas */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Vagas encontradas</span>
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.jobsFound}</div>
          <div className="text-[11px] text-slate-500 mt-1">Listadas no Themos Vagas</div>
        </div>

        {/* 2. Vagas analisadas */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Vagas analisadas</span>
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300">{stats.jobsAnalyzed}</div>
          <div className="text-[11px] text-slate-500 mt-1">Páginas públicas abertas</div>
        </div>

        {/* 3. Vagas com e-mail */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Vagas com e-mail</span>
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.jobsWithEmail}</div>
          <div className="text-[11px] text-slate-500 mt-1">Com e-mail divulgado</div>
        </div>

        {/* 4. Contatos encontrados (Todas as ocorrências) */}
        <div className="bg-slate-950/70 border border-sky-500/30 bg-sky-950/10 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Contatos encontrados</span>
            <AtSign className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-300">{totalAllContacts}</div>
          <div className="text-[11px] text-sky-400/80 mt-1">Todas as ocorrências</div>
        </div>

        {/* 5. E-mails únicos (Deduplicados) */}
        <div className="bg-slate-950/70 border border-emerald-500/40 bg-emerald-950/20 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>E-mails únicos</span>
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">{totalUniqueEmails}</div>
          <div className="text-[11px] text-emerald-400/90 font-medium mt-1">Sem repetições</div>
        </div>
      </div>

      {/* Access errors note if any */}
      {stats.accessErrors > 0 && (
        <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {stats.accessErrors} vaga(s) não puderam ser acessadas pelo servidor (erro de conexão/HTTP). As demais foram processadas normalmente.
          </span>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
        <div className="text-slate-400 font-medium">Modo de visualização:</div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => onViewModeChange('cards')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              viewMode === 'cards'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cards das Vagas ({stats.jobsAnalyzed})
          </button>
          <button
            onClick={() => onViewModeChange('unique_emails')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'unique_emails'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>📧 E-mails únicos ({totalUniqueEmails})</span>
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tabela
          </button>
        </div>
      </div>
    </div>
  );
};
