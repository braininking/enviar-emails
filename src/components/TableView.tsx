import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Mail } from 'lucide-react';
import { JobVacancy } from '../types/job';

interface TableViewProps {
  jobs: JobVacancy[];
  onCopyEmail: (email: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({ jobs, onCopyEmail }) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    onCopyEmail(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Vaga</th>
              <th className="py-3 px-4">Localização</th>
              <th className="py-3 px-4">E-mail(s)</th>
              <th className="py-3 px-4">Assunto</th>
              <th className="py-3 px-4">Publicada</th>
              <th className="py-3 px-4">Prazo</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-slate-800/40 transition-colors group text-slate-300"
              >
                <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                  <div className="line-clamp-2 leading-tight">{job.title}</div>
                  {job.company && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{job.company}</div>
                  )}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 text-xs">
                  {job.locationRaw || `${job.city || ''} ${job.state || ''}`}
                </td>

                <td className="py-3.5 px-4">
                  {job.emails.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {job.emails.map((email) => {
                        const isCopied = copiedEmail === email;
                        return (
                          <div key={email} className="flex items-center gap-1.5">
                            <span className="font-mono text-emerald-300 text-xs">{email}</span>
                            <button
                              onClick={() => handleCopy(email)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Copiar e-mail"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : job.status === 'error' ? (
                    <span className="text-rose-400 text-xs">Acesso indisponível</span>
                  ) : (
                    <span className="text-slate-500 text-xs italic">Nenhum e-mail</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-xs max-w-xs">
                  {job.applicationSubject ? (
                    <span className="text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      {job.applicationSubject}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                  {job.publishedDate || '—'}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                  {job.deadline ? (
                    <span className="text-amber-300/90 font-medium">{job.deadline}</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
