import React from 'react';
import { Search, MapPin, Square, Loader2, Sparkles } from 'lucide-react';

interface SearchBarProps {
  term: string;
  onTermChange: (value: string) => void;
  selectedCities: string[];
  isSearching: boolean;
  onSearch: () => void;
  onStop: () => void;
  quickSuggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  term,
  onTermChange,
  selectedCities,
  isSearching,
  onSearch,
  onStop,
  quickSuggestions,
  onSelectSuggestion,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    if (isSearching) {
      onStop();
    } else {
      onSearch();
    }
  };

  const citySummary =
    selectedCities.length === 0
      ? 'Nenhuma selecionada'
      : selectedCities.includes('Todas as cidades')
      ? 'Todas as cidades'
      : selectedCities.length === 1
      ? selectedCities[0]
      : `${selectedCities[0]} (+${selectedCities.length - 1} outras)`;

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-cyan-950/20 ring-1 ring-white/5 transition-all"
      >
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-end">
          {/* Main Field: Cargo ou Profissão */}
          <div className="flex-1">
            <label
              htmlFor="job-title-input"
              className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Digite o cargo ou profissão</span>
            </label>
            <div className="relative">
              <input
                id="job-title-input"
                type="text"
                value={term}
                onChange={(e) => onTermChange(e.target.value)}
                placeholder="Ex.: Operador de Telemarketing"
                disabled={isSearching}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-slate-500 text-sm sm:text-base rounded-xl px-4 py-3.5 outline-none transition-all disabled:opacity-60 shadow-inner"
              />
              {term && !isSearching && (
                <button
                  type="button"
                  onClick={() => onTermChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded-md cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Quick Cities Summary Indicator */}
          <div className="w-full lg:w-64">
            <label className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Cidades alvo</span>
            </label>
            <div className="w-full bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm rounded-xl px-4 py-3.5 flex items-center justify-between gap-2 shadow-inner">
              <span className="truncate font-medium text-emerald-300">{citySummary}</span>
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {selectedCities.includes('Todas as cidades') ? 'Todas' : `${selectedCities.length} cid.`}
              </span>
            </div>
          </div>

          {/* Search / Stop Button */}
          <div className="w-full lg:w-auto">
            {isSearching ? (
              <button
                type="button"
                onClick={onStop}
                className="w-full lg:w-auto px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current animate-pulse" />
                <span>⏹ PARAR PESQUISA</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!term.trim() || selectedCities.length === 0}
                className="w-full lg:w-auto px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>🔎 PUXAR VAGAS</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick suggestions pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Exemplos:
          </span>
          {quickSuggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              disabled={isSearching}
              onClick={() => onSelectSuggestion(sug)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
