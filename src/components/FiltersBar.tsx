import React from 'react';
import { Sparkles, Check, Layers, Mail } from 'lucide-react';
import { SearchFilters } from '../types/job';

interface FiltersBarProps {
  filters: SearchFilters;
  onChange: (newFilters: SearchFilters) => void;
  disabled?: boolean;
  relatedTerms?: string[];
  currentTerm?: string;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onChange,
  disabled = false,
  relatedTerms = [],
  currentTerm = '',
}) => {
  const toggleOnlyWithEmail = () => {
    onChange({ ...filters, onlyWithEmail: !filters.onlyWithEmail });
  };

  const toggleIncludeRelated = () => {
    onChange({ ...filters, includeRelated: !filters.includeRelated });
  };

  const handleMaxPagesChange = (pages: number) => {
    onChange({ ...filters, maxPages: pages });
  };

  return (
    <div className="w-full mt-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Checkbox Filters */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          {/* Somente vagas com e-mail */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={filters.onlyWithEmail}
              onChange={toggleOnlyWithEmail}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                filters.onlyWithEmail
                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                  : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
              }`}
            >
              {filters.onlyWithEmail && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span
              className={`font-medium transition-colors ${
                filters.onlyWithEmail ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'
              }`}
            >
              Somente vagas que possuem e-mail
            </span>
          </label>

          {/* Pesquisar termos relacionados */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={filters.includeRelated}
              onChange={toggleIncludeRelated}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                filters.includeRelated
                  ? 'bg-indigo-500 border-indigo-400 text-white font-bold'
                  : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
              }`}
            >
              {filters.includeRelated && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span
              className={`font-medium flex items-center gap-1.5 transition-colors ${
                filters.includeRelated ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Pesquisar termos relacionados
            </span>
          </label>

          {/* Regra de preservação informativa */}
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Layers className="w-3 h-3 text-emerald-400" />
            Todas as vagas e contatos são preservados
          </span>
        </div>

        {/* Max Pages selector */}
        <div className="flex items-center gap-2 text-slate-400 ml-auto text-xs">
          <span>Profundidade:</span>
          <select
            value={filters.maxPages}
            onChange={(e) => handleMaxPagesChange(Number(e.target.value))}
            disabled={disabled}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value={5}>Até 5 páginas (~80 vagas)</option>
            <option value={10}>Até 10 páginas (~160 vagas)</option>
            <option value={15}>Até 15 páginas (~240 vagas)</option>
          </select>
        </div>
      </div>

      {/* Related Terms Expansion Preview if checked */}
      {filters.includeRelated && relatedTerms.length > 0 && currentTerm && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>
              Termos relacionados incluídos para <strong className="text-white">"{currentTerm}"</strong>:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {relatedTerms.map((term, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-[11px]"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
