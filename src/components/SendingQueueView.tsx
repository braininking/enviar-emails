import React from 'react';
import {
  Play,
  Pause,
  XOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Campaign } from '../types';

interface SendingQueueViewProps {
  campaign: Campaign;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onFinish: () => void;
}

export const SendingQueueView: React.FC<SendingQueueViewProps> = ({
  campaign,
  onPause,
  onResume,
  onCancel,
  onFinish,
}) => {
  const total = campaign.totalRecipients || 1;
  const processed = (campaign.sentCount || 0) + (campaign.failedCount || 0);
  const percentage = Math.min(100, Math.round((processed / total) * 100));
  const isFinished = campaign.status === 'completed' || campaign.status === 'cancelled';
  const isPaused = campaign.status === 'paused';
  const isRunning = campaign.status === 'in_progress';

  return (
    <div className="space-y-6">
      {/* Top Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isRunning
                    ? 'bg-blue-500 animate-ping'
                    : isPaused
                    ? 'bg-amber-500'
                    : campaign.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
              />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isRunning && 'Enviando campanha...'}
                {isPaused && 'Campanha pausada'}
                {campaign.status === 'completed' && 'Campanha concluída!'}
                {campaign.status === 'cancelled' && 'Campanha cancelada'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Assunto: <strong className="text-slate-200">{campaign.subject}</strong> • Remetente:{' '}
              <strong className="text-emerald-400 font-mono">{campaign.senderEmail}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {isRunning && (
              <button
                type="button"
                onClick={onPause}
                className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" /> Pausar
              </button>
            )}
            {isPaused && (
              <button
                type="button"
                onClick={onResume}
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Continuar
              </button>
            )}
            {!isFinished && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-initial px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <XOctagon className="w-3.5 h-3.5" /> Cancelar campanha
              </button>
            )}
            {isFinished && (
              <button
                type="button"
                onClick={onFinish}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-colors cursor-pointer"
              >
                Ver no Histórico
              </button>
            )}
          </div>
        </div>

        {/* Warning if insufficient authentication scopes detected */}
        {campaign.recipients.some((r) => r.error?.includes('insufficient authentication scopes')) && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold">
                  Permissão de envio de e-mails necessária:
                </strong>
                <span>
                  O Google exige que você marque a caixa <strong>"Enviar e-mails em seu nome"</strong> na tela de autorização da sua conta Google.
                </span>
              </div>
            </div>
            <button
              onClick={async () => {
                const { googleSignIn } = await import('../services/authService');
                await googleSignIn();
                onResume();
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 transition-colors cursor-pointer"
            >
              Reautorizar Gmail
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-300">
              Progresso do lote: <span className="font-bold text-white">{processed}</span> de{' '}
              <span className="font-bold text-white">{total}</span>
            </span>
            <span className="text-blue-400 font-mono font-bold">{percentage}%</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                campaign.status === 'completed'
                  ? 'bg-emerald-500'
                  : isPaused
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Counters summary */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-center">
            <span className="text-xs text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enviados
            </span>
            <span className="text-xl font-bold text-emerald-300 block mt-1">
              {campaign.sentCount}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-center">
            <span className="text-xs text-rose-400 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Falharam
            </span>
            <span className="text-xl font-bold text-rose-300 block mt-1">
              {campaign.failedCount}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-center">
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Aguardando
            </span>
            <span className="text-xl font-bold text-slate-300 block mt-1">
              {campaign.pendingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Table of Individual Recipients */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Status Individual dos Envios</h3>
          <span className="text-xs text-slate-400">{campaign.recipients.length} destinatários</span>
        </div>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-3 px-4">Destinatário</th>
                <th className="py-3 px-4">Empresa / Cargo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Horário / Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {campaign.recipients.map((rcp) => (
                <tr key={rcp.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-200">{rcp.email}</div>
                    {rcp.name && <div className="text-[11px] text-slate-400">{rcp.name}</div>}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    <div>{rcp.company || '-'}</div>
                    {rcp.role && <div className="text-[11px] text-slate-500">{rcp.role}</div>}
                  </td>
                  <td className="py-3 px-4">
                    {rcp.status === 'sent' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                      </span>
                    )}
                    {rcp.status === 'failed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" /> Erro
                      </span>
                    )}
                    {rcp.status === 'sending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                        <RotateCw className="w-3.5 h-3.5 animate-spin" /> Enviando...
                      </span>
                    )}
                    {rcp.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        <Clock className="w-3.5 h-3.5" /> Aguardando
                      </span>
                    )}
                    {rcp.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-500">
                        Cancelado
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {rcp.sentAt && (
                      <div className="text-slate-300">
                        {new Date(rcp.sentAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    )}
                    {rcp.error && (
                      <div className="text-[11px] text-rose-400 mt-0.5 line-clamp-2" title={rcp.error}>
                        {rcp.error}
                      </div>
                    )}
                    {!rcp.sentAt && !rcp.error && <span className="text-slate-600">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
