import React, { useState } from 'react';
import {
  MapPin,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Building,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { JobVacancy } from '../types/job';

interface JobCardProps {
  job: JobVacancy;
  onCopyEmail: (email: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onCopyEmail }) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    onCopyEmail(email);
    setCopiedEmail(email);
    setTimeout(() => {
      setCopiedEmail(null);
    }, 2000);
  };

  const handleCopyFirstEmail = () => {
    if (job.emails.length > 0) {
      handleCopy(job.emails[0]);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 bg-slate-900/90 shadow-lg hover:shadow-cyan-950/20 hover:border-slate-700/80 flex flex-col justify-between ${
        job.hasEmail
          ? 'border-slate-800'
          : job.status === 'error'
          ? 'border-rose-900/30 bg-rose-950/10'
          : 'border-slate-800/60 opacity-80'
      }`}
    >
      <div>
        {/* Top Badges & Title */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
            {job.title}
          </h3>
          {job.hasEmail ? (
            <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {job.emails.length === 1 ? '1 e-mail' : `${job.emails.length} e-mails`}
            </span>
          ) : job.status === 'error' ? (
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Acesso indisponível
            </span>
          ) : (
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
              Sem e-mail
            </span>
          )}
        </div>

        {/* Location & Company */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mb-3.5">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>📍 {job.locationRaw || `${job.city || 'Piauí'} - ${job.state || 'BR'}`}</span>
          </div>

          {job.company && (
            <div className="flex items-center gap-1 text-slate-400">
              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{job.company}</span>
            </div>
          )}
        </div>

        {/* Highlighted Email Box */}
        <div className="mb-4">
          {job.emails.length > 0 ? (
            <div className="space-y-2">
              {job.emails.map((email) => {
                const isCopied = copiedEmail === email;
                return (
                  <div
                    key={email}
                    className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 group hover:border-emerald-500/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-mono font-medium text-emerald-300 truncate select-all">
                        {email}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(email)}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
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
                );
              })}
            </div>
          ) : job.status === 'error' ? (
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Não foi possível acessar esta vaga.</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Nenhum e-mail encontrado</span>
            </div>
          )}
        </div>

        {/* Application Subject & Snippet if available */}
        {job.applicationSubject && (
          <div className="mb-3 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs">
            <span className="text-cyan-400 font-semibold flex items-center gap-1 mb-0.5">
              <FileText className="w-3.5 h-3.5" />
              📝 Assunto:
            </span>
            <span className="text-slate-200 font-medium select-all">
              "{job.applicationSubject}"
            </span>
          </div>
        )}

        {job.applicationSnippet && !job.applicationSubject && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 line-clamp-2">
            <span className="text-slate-500 font-medium mr-1">Trecho:</span>
            {job.applicationSnippet}
          </div>
        )}
      </div>

      {/* Footer Info: Published Date, Deadline & Actions */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-3">
          {job.publishedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>📅 Publicada em: {job.publishedDate}</span>
            </div>
          )}

          {job.deadline ? (
            <div className="flex items-center gap-1 text-amber-300/90 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>⏰ Prazo: {job.deadline}</span>
            </div>
          ) : (
            <div className="text-slate-500 text-[11px]">Prazo: Não especificado</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {job.hasEmail && (
            <button
              onClick={handleCopyFirstEmail}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>COPIAR E-MAIL</span>
            </button>
          )}

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>ABRIR VAGA</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
