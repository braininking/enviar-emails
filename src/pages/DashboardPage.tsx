import React from 'react';
import {
  Send,
  AlertCircle,
  FileCheck2,
  Calendar,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Inbox,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Campaign } from '../types';
import { getDashboardStats } from '../services/campaignService';

interface DashboardPageProps {
  onNewCampaign: () => void;
  onViewCampaign: (campaign: Campaign) => void;
  onGoToCampaigns: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNewCampaign,
  onViewCampaign,
  onGoToCampaigns,
}) => {
  const stats = getDashboardStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/20 p-6 sm:p-8">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Gratuito • Zero Cobrança
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Cota Oficial do Gmail (até 500 e-mails/dia grátis)
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Envie seus currículos com precisão e controle
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Você não paga absolutamente nada para usar este aplicativo. O envio utiliza a sua própria conta gratuita do Gmail, sem planos pagos, sem cartão de crédito e sem taxas ocultas.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNewCampaign}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Nova campanha
            </button>
            <button
              onClick={onGoToCampaigns}
              className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-medium rounded-xl border border-slate-700/80 transition-all cursor-pointer"
            >
              Ver todas campanhas
            </button>
          </div>
        </div>
        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 to-transparent pointer-events-none" />
      </div>

      {/* Estatísticas Grid */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Visão Geral dos Envios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Enviados */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">E-mails enviados</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.totalSent.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-emerald-400 block mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Entregues com sucesso
              </span>
            </div>
          </div>

          {/* Card 2: Campanhas Realizadas */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Campanhas realizadas</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.campaignsCount}
              </span>
              <span className="text-xs text-slate-400 block mt-1">Lotes organizados</span>
            </div>
          </div>

          {/* Card 3: Erros */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">E-mails com erro</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.totalErrors}
              </span>
              <span className="text-xs text-rose-400 block mt-1">
                {stats.totalErrors > 0 ? 'Endereços inexistentes ou recusa' : 'Nenhum erro registrado'}
              </span>
            </div>
          </div>

          {/* Card 4: Taxa de Sucesso */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Taxa de entrega</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.totalSent + stats.totalErrors > 0
                  ? `${Math.round((stats.totalSent / (stats.totalSent + stats.totalErrors)) * 100)}%`
                  : '100%'}
              </span>
              <span className="text-xs text-indigo-400 block mt-1">Precisão da lista</span>
            </div>
          </div>
        </div>
      </div>

      {/* Última Campanha Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Última Campanha Realizada</h3>
          </div>
          {stats.lastCampaign && (
            <button
              onClick={() => onViewCampaign(stats.lastCampaign!)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              Ver detalhes <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {stats.lastCampaign ? (
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-200">
                {stats.lastCampaign.subject}
              </h4>
              <p className="text-xs text-slate-400">
                Criada em:{' '}
                {new Date(stats.lastCampaign.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                • Remetente: <span className="text-emerald-400 font-mono">{stats.lastCampaign.senderEmail}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Destinatários: </span>
                <span className="font-bold text-white">{stats.lastCampaign.totalRecipients}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                ✓ {stats.lastCampaign.sentCount} enviados
              </div>
              {stats.lastCampaign.failedCount > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                  ✗ {stats.lastCampaign.failedCount} falhas
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nenhuma campanha disparada ainda. Clique em "+ Nova campanha" para começar.
          </div>
        )}
      </div>
    </div>
  );
};
