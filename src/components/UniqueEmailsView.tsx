import React, { useState } from 'react';
import { Mail, Copy, Check, ExternalLink, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { UniqueEmailMapping } from '../types/job';

interface UniqueEmailsViewProps {
  uniqueEmails: UniqueEmailMapping[];
  onCopySingleEmail: (email: string) => void;
  onCopyAllUnique: () => void;
}

export const UniqueEmailsView: React.FC<UniqueEmailsViewProps> = ({
  uniqueEmails,
  onCopySingleEmail,
  onCopyAllUnique,
}) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    onCopySingleEmail(email);
    setCopiedEmail(email);
    setTimeout(() => {
      setCopiedEmail(null);
    }, 2000);
  };

  const toggleExpand = (email: string) => {
    setExpandedEmail((prev) => (prev === email ? null : email));
  };

  if (uniqueEmails.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-300">Nenhum e-mail único disponível</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          As vagas analisadas até o momento não continham e-mails de contato público.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">
            {uniqueEmails.length} e-mail(s) único(s) desduplicado(s)
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            (prontos para envio de currículo)
          </span>
        </div>

        <button
          onClick={onCopyAllUnique}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Copiar Todos ({uniqueEmails.length})</span>
        </button>
      </div>

      {/* List of Unique Emails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {uniqueEmails.map((item) => {
          const isCopied = copiedEmail === item.email;
          const isExpanded = expandedEmail === item.email;

          return (
            <div
              key={item.email}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="font-mono text-sm font-semibold text-emerald-300 truncate select-all">
                      {item.email}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(item.email)}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    title="Copiar este e-mail"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Counter of jobs where this email appears */}
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
                    <Briefcase className="w-3 h-3 text-cyan-400" />
                    Encontrado em {item.jobCount} vaga(s)
                  </span>

                  <button
                    onClick={() => toggleExpand(item.email)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>{isExpanded ? 'Ocultar vagas' : 'Ver vagas relacionadas'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Expanded details: list of jobs where this email appeared */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-in fade-in duration-200">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Vagas associadas a este e-mail:
                  </div>
                  {item.jobs.map((job, idx) => (
                    <div
                      key={job.id || idx}
                      className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-200 font-medium leading-tight line-clamp-1">
                          {job.title}
                        </span>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-slate-400 hover:text-cyan-300 p-0.5"
                          title="Abrir no Themos Vagas"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {job.applicationSubject && (
                        <div className="text-[11px] text-cyan-300">
                          <span className="text-slate-500">Assunto sugerido:</span> "{job.applicationSubject}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
