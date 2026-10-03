import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, X, Check, RotateCcw, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

type City = { id:number; nome:string; microrregiao?: { mesorregiao?: { UF?: { sigla:string; nome:string } } } };

interface CityFilterProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  discoveredCities?: string[];
  disabled?: boolean;
}

const ALL = 'Todas as cidades';

export const CityFilter: React.FC<CityFilterProps> = ({ selectedCities, onChange, discoveredCities = [], disabled = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      .then(r => { if (!r.ok) throw new Error('Falha ao carregar municípios'); return r.json(); })
      .then(data => { if (active) setCities(data); })
      .catch(e => { if (active) setLoadError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const normalize = (s:string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const q = normalize(searchQuery);
  const allSelected = selectedCities.includes(ALL);

  const visibleCities = useMemo(() => {
    if (!q) return cities;
    return cities.filter(c => normalize(c.nome).includes(q) || normalize(c.microrregiao?.mesorregiao?.UF?.nome || '').includes(q) || normalize(c.microrregiao?.mesorregiao?.UF?.sigla || '').includes(q));
  }, [cities, q]);

  const discovered = useMemo(() => Array.from(new Set(discoveredCities.map(c => c.trim()).filter(Boolean))).sort(), [discoveredCities]);

  const toggleCity = (city:string) => {
    if (disabled) return;
    if (allSelected) onChange([city]);
    else if (selectedCities.includes(city)) onChange(selectedCities.filter(c => c !== city));
    else onChange([...selectedCities, city]);
  };

  const toggleAll = () => {
    if (disabled) return;
    onChange(allSelected ? ['Teresina'] : [ALL]);
  };

  const clear = () => { if (!disabled) onChange([]); };

  return (
    <div className="w-full mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><MapPin className="w-4 h-4"/></div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">📍 Filtrar por cidade <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">{allSelected ? 'Todas' : `${selectedCities.length} selecionada(s)`}</span></h3>
            <p className="text-[11px] text-slate-400">Brasil inteiro: todos os municípios dos 26 estados + Distrito Federal.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button type="button" onClick={clear} disabled={disabled || !selectedCities.length} className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-rose-400 border border-slate-700/60 flex items-center gap-1 disabled:opacity-40"><RotateCcw className="w-3 h-3"/>Limpar cidades</button>
          <button type="button" onClick={() => setExpanded(!expanded)} className="p-1 rounded-lg text-slate-400 hover:text-white border border-slate-700/60">{expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 min-h-[30px]">
        {!selectedCities.length ? <span className="text-xs text-amber-400/90 italic">⚠️ Nenhuma cidade selecionada</span> :
          selectedCities.map(city => <span key={city} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35"><span>{city}</span>{!disabled && <button type="button" onClick={() => onChange(selectedCities.filter(c => c !== city))}><X className="w-3 h-3"/></button>}</span>)}
      </div>

      {expanded && <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔎 Pesquisar cidade ou estado..." disabled={disabled} className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"/>
          </div>
          <button type="button" onClick={toggleAll} disabled={disabled} className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${allSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 border border-slate-700 text-slate-300'}`}><Check className="w-3.5 h-3.5"/><span>Todas as cidades do Brasil</span></button>
        </div>

        {loading && <div className="flex items-center gap-2 text-xs text-slate-400 py-4"><Loader2 className="w-4 h-4 animate-spin"/>Carregando todos os municípios do Brasil...</div>}
        {loadError && <div className="text-xs text-rose-300 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">{loadError}</div>}

        {!loading && !loadError && <div className="max-h-[430px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
          {visibleCities.map(city => {
            const label = city.nome;
            const uf = city.microrregiao?.mesorregiao?.UF?.sigla || '';
            const selected = selectedCities.includes(label) || allSelected;
            const direct = selectedCities.includes(label);
            return <label key={city.id} className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none ${direct ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : selected ? 'bg-slate-900 border-emerald-500/20 text-slate-300' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
              <input type="checkbox" checked={direct} onChange={() => toggleCity(label)} disabled={disabled} className="sr-only"/>
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${direct ? 'bg-emerald-500 border-emerald-400 text-slate-950' : selected ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-700'}`}>{selected && <Check className="w-2.5 h-2.5 stroke-[3]"/>}</div>
              <span className="truncate">{label} <span className="text-[9px] text-slate-500">{uf}</span></span>
            </label>;
          })}
        </div>}

        {discovered.length > 0 && <div className="pt-3 border-t border-slate-800/60">
          <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5"/>Cidades encontradas automaticamente ({discovered.length})</div>
          <div className="flex flex-wrap gap-1.5">{discovered.map(city => <button key={city} type="button" onClick={() => toggleCity(city)} disabled={disabled} className="px-2 py-1 rounded-lg text-xs border border-indigo-800/60 text-indigo-300 bg-indigo-950/40">{city}</button>)}</div>
        </div>}
      </div>}
    </div>
  );
};
