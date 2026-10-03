import React, { useState } from 'react';
import { ShieldCheck, Trash2, CheckCircle } from 'lucide-react';
import { clearAllLocalData } from '../services/campaignService';

interface PrivacyPageProps {
  onDataCleared: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onDataCleared }) => {
  const [cleared, setCleared] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    clearAllLocalData();
    setCleared(true);
    setShowConfirm(false);
    onDataCleared();
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Privacidade & Dados Locais</h2>
        <p className="text-xs text-slate-400">
          Entenda como seus contatos, mensagens e arquivos são protegidos no Currículo Mail.
        </p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Compromisso com a Privacidade e Segurança</h3>
            <p className="text-xs text-slate-400">Diretrizes de conformidade e tratamento de dados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Contatos fornecidos por você
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Todos os endereços de recrutadores e empresas são fornecidos diretamente por você via Ctrl+V, importação de planilhas ou busca no Themos Vagas. O sistema não realiza compra ou mineração indevida externa.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Arquivos e Currículos em PDF
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Os arquivos anexados são convertidos para envio direto pelo protocolo da Gmail API e processados estritamente para o disparo da sua candidatura.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Credenciais e Autenticação OAuth
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nenhuma senha do seu Gmail é armazenada. A comunicação ocorre com tokens em memória via Google OAuth oficial, com escopo restrito ao envio de mensagens em seu nome.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Sem coleta de dados desnecessários
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O aplicativo não vende nem compartilha suas listas de empresas ou currículos com terceiros.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone: Excluir dados locais */}
      <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Excluir Dados Locais</h3>
            <p className="text-xs text-slate-400">
              Apagar histórico de campanhas, listas temporárias e preferências armazenadas no navegador.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Esta ação limpa o banco de dados local do seu navegador (localStorage) contendo o histórico de candidaturas enviadas e eventuais rascunhos. Não afeta os e-mails já entregues nas caixas postais.
        </p>

        {cleared && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Dados locais excluídos com sucesso!
          </div>
        )}

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Excluir dados locais
          </button>
        ) : (
          <div className="p-4 bg-slate-950 rounded-xl border border-rose-500/40 space-y-3">
            <p className="text-xs text-rose-300 font-semibold">
              Tem certeza que deseja apagar todo o histórico e dados locais deste navegador?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Sim, excluir tudo
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
