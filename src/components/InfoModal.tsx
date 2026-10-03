import React from 'react';
import { X, ShieldCheck, Mail, Search, CheckCircle, AlertTriangle } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Como Funciona o Vagas Email Finder</h3>
            <p className="text-xs text-slate-400">Transparência e extração ética de dados públicos</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="font-semibold text-cyan-300 flex items-center gap-2 mb-1.5">
              <Search className="w-4 h-4" />
              1. Busca em tempo real no Themos Vagas
            </h4>
            <p className="text-slate-400">
              O sistema pesquisa as publicações reais em <strong>themosvagas.com.br</strong> para o cargo e região informados, navegando página por página.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="font-semibold text-emerald-300 flex items-center gap-2 mb-1.5">
              <Mail className="w-4 h-4" />
              2. Extração de e-mails públicos de candidatura
            </h4>
            <p className="text-slate-400">
              Apenas os endereços de e-mail efetivamente publicados dentro do corpo da vaga (seção "Currículos" / "Como se candidatar") são extraídos. E-mails de desenvolvedores ou temas do site são filtrados e ignorados.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="font-semibold text-amber-300 flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4" />
              3. Regra fundamental: Nunca inventar dados
            </h4>
            <p className="text-slate-400">
              O sistema <strong>não inventa</strong> e-mails, empresas, assuntos ou prazos. Se uma vaga orientar a candidatura por WhatsApp ou formulário externo, ela será marcada como <em>"Nenhum e-mail encontrado"</em>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="font-semibold text-indigo-300 flex items-center gap-2 mb-1.5">
              <CheckCircle className="w-4 h-4" />
              4. Desduplicação inteligente
            </h4>
            <p className="text-slate-400">
              Se uma mesma empresa ou agência de recrutamento postar 5 vagas diferentes com o mesmo e-mail, você pode copiar uma lista limpa com e-mails únicos, mantendo a rastreabilidade de todas as vagas onde ele apareceu.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
