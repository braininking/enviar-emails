import React, { useEffect, useState } from 'react';
import { Globe, Sparkles, Loader2, Mail, ExternalLink } from 'lucide-react';

type Result = {
  title?: string; company?: string; city?: string; state?: string;
  publishedDate?: string; url?: string; email?: string; emails?: string[]; snippet?: string; source?: string;
};

export const AIWebSearchPanel: React.FC<{ term: string; cities: string[]; onSendToCampaign: (emails: string[]) => void }> = ({ term, cities, onSendToCampaign }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState('');
  const [cityLabels, setCityLabels] = useState<string[]>(cities);
  useEffect(() => {
    let active = true;
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome').then(r => r.ok ? r.json() : []).then((data: any[]) => {
      if (!active) return;
      const wanted = new Set(cities.map(c => c.trim().toLowerCase()));
      const labels = data.filter(c => wanted.has(String(c.nome).trim().toLowerCase())).map(c => `${c.nome}/${c.microrregiao?.mesorregiao?.UF?.sigla || ''}`);
      setCityLabels(labels.length ? labels : cities);
    }).catch(() => setCityLabels(cities));
    return () => { active = false; };
  }, [cities.join('|')]);

  const search = async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ term, cities: cityLabels.join(',') });
      const r = await fetch(`/api/ai-search/web?${qs}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Falha na pesquisa.');
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || 'Falha na pesquisa por IA.');
    } finally { setLoading(false); }
  };

  const emails = Array.from(new Set(results.flatMap(r => [...(r.emails || []), ...(r.email ? [r.email] : [])]).map(e => String(e).trim().toLowerCase()).filter(Boolean)));

  return (
    <div className="p-6 bg-gradient-to-br from-violet-950/40 via-slate-900 to-cyan-950/30 border border-violet-500/30 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-violet-300 text-xs font-bold"><Sparkles className="w-3.5 h-3.5" /> PESQUISA IA NA INTERNET</div>
          <h3 className="text-lg font-bold text-white mt-1">Buscar vagas além do Themos</h3>
          <p className="text-xs text-slate-400 mt-1">Pesquisa a internet por empresas, vagas e contatos públicos de RH/recrutamento na cidade e UF selecionadas.</p>
        </div>
        <button onClick={search} disabled={loading || !term.trim()} className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          {loading ? 'Pesquisando na internet...' : 'Pesquisar com IA'}
        </button>
      </div>
      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{error}</div>}
      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
            <span><b className="text-white">{results.length}</b> resultados encontrados • <b className="text-white">{emails.length}</b> e-mails públicos</span>
            {emails.length > 0 && <button onClick={() => onSendToCampaign(emails)} className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Enviar para campanha</button>}
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {results.map((r, i) => (
              <div key={i} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{r.title || 'Vaga encontrada'}</h4>
                    <p className="text-xs text-cyan-300 mt-1">{r.company || 'Empresa não informada'} {r.city ? `• ${r.city}${r.state ? `/${r.state}` : ''}` : ''}</p>
                  </div>
                  {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white"><ExternalLink className="w-4 h-4" /></a>}
                </div>
                {r.publishedDate && <div className="text-[11px] text-slate-500 mt-2">Publicação: {r.publishedDate}</div>}
                {(r.emails?.length || r.email) && <div className="text-xs text-emerald-300 mt-2">✉ {[...(r.emails || []), ...(r.email ? [r.email] : [])].filter((e, i, a) => e && a.indexOf(e) === i).join(' • ')}</div>}
                {r.snippet && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{r.snippet}</p>}
                {r.source && <div className="text-[10px] text-slate-600 mt-2">{r.source}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
