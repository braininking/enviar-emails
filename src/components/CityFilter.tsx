import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const INITIAL_PI_CITIES = [
  'Teresina',
  'Parnaíba',
  'Picos',
  'Floriano',
  'Piripiri',
  'Campo Maior',
  'União',
  'José de Freitas',
  'Altos',
  'Esperantina',
  'Oeiras',
  'Bom Jesus',
  'São Raimundo Nonato',
  'Pedro II',
  'Corrente',
];

export const INITIAL_MA_CITIES = [
  'São Luís',
  'Imperatriz',
  'Timon',
  'Caxias',
  'Codó',
  'Bacabal',
  'Balsas',
  'Santa Inês',
];

interface CityFilterProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  discoveredCities?: string[];
  disabled?: boolean;
}

export const CityFilter: React.FC<CityFilterProps> = ({
  selectedCities,
  onChange,
  discoveredCities = [],
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Normalize helper for diacritic-free search
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const isAllCitiesSelected = selectedCities.includes('Todas as cidades');
  const isAllPiSelected = selectedCities.includes('Todas as cidades do Piauí');
  const isAllMaSelected = selectedCities.includes('Todas as cidades do Maranhão');

  // Filter lists based on search query
  const queryNorm = normalize(searchQuery);

  const filteredPiCities = useMemo(() => {
    if (!queryNorm) return INITIAL_PI_CITIES;
    return INITIAL_PI_CITIES.filter((c) => normalize(c).includes(queryNorm));
  }, [queryNorm]);

  const filteredMaCities = useMemo(() => {
    if (!queryNorm) return INITIAL_MA_CITIES;
    return INITIAL_MA_CITIES.filter((c) => normalize(c).includes(queryNorm));
  }, [queryNorm]);

  // Unique extra cities discovered dynamically from Themos Vagas
  const extraDiscovered = useMemo(() => {
    const known = new Set(
      [...INITIAL_PI_CITIES, ...INITIAL_MA_CITIES].map((c) => normalize(c))
    );
    return Array.from(
      new Set(
        discoveredCities
          .map((c) => c.trim())
          .filter((c) => c && !known.has(normalize(c)))
      )
    ).sort();
  }, [discoveredCities]);

  const filteredExtraCities = useMemo(() => {
    if (!queryNorm) return extraDiscovered;
    return extraDiscovered.filter((c) => normalize(c).includes(queryNorm));
  }, [extraDiscovered, queryNorm]);

  // Toggle single city selection
  const toggleCity = (city: string) => {
    if (disabled) return;

    // If "Todas as cidades" was selected, clicking a specific city replaces it
    if (isAllCitiesSelected) {
      onChange([city]);
      return;
    }

    if (selectedCities.includes(city)) {
      const next = selectedCities.filter((c) => c !== city);
      onChange(next);
    } else {
      onChange([...selectedCities, city]);
    }
  };

  // Toggle "Todas as cidades"
  const toggleAllCities = () => {
    if (disabled) return;
    if (isAllCitiesSelected) {
      // Revert to default: Teresina
      onChange(['Teresina']);
    } else {
      // Selecting "Todas as cidades" automatically clears individual cities
      onChange(['Todas as cidades']);
    }
  };

  // Toggle "Todas as cidades do Piauí"
  const toggleAllPi = () => {
    if (disabled) return;
    if (isAllPiSelected) {
      onChange(selectedCities.filter((c) => c !== 'Todas as cidades do Piauí'));
    } else {
      const clean = selectedCities.filter((c) => c !== 'Todas as cidades');
      onChange([...clean, 'Todas as cidades do Piauí']);
    }
  };

  // Toggle "Todas as cidades do Maranhão"
  const toggleAllMa = () => {
    if (disabled) return;
    if (isAllMaSelected) {
      onChange(selectedCities.filter((c) => c !== 'Todas as cidades do Maranhão'));
    } else {
      const clean = selectedCities.filter((c) => c !== 'Todas as cidades');
      onChange([...clean, 'Todas as cidades do Maranhão']);
    }
  };

  // Remove single chip
  const removeChip = (cityToRemove: string) => {
    if (disabled) return;
    onChange(selectedCities.filter((c) => c !== cityToRemove));
  };

  // Clear all selections
  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="w-full mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>📍 Filtrar por cidade</span>
              {selectedCities.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  {isAllCitiesSelected ? 'Todas' : `${selectedCities.length} selecionada(s)`}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Filtro estrito: a vaga precisa ter sido anunciada exatamente para as cidades escolhidas
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled || selectedCities.length === 0}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/60 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Remover todas as seleções de cidade"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar cidades</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
            title={isExpanded ? 'Recolher seletor' : 'Expandir seletor'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Selected Chips Row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 min-h-[30px]">
        {selectedCities.length === 0 ? (
          <span className="text-xs text-amber-400/90 italic flex items-center gap-1">
            ⚠️ Nenhuma cidade selecionada (selecione pelo menos uma ou marque "Todas as cidades")
          </span>
        ) : (
          selectedCities.map((city) => (
            <span
              key={city}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all animate-in fade-in zoom-in-95 duration-150 ${
                city === 'Todas as cidades'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
              }`}
            >
              <span>{city}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeChip(city)}
                  className="hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  title={`Remover ${city}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Expandable selection panel */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-4">
          {/* Search bar inside cities */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔎 Pesquisar cidade..."
                disabled={disabled}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all disabled:opacity-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* "Todas as cidades" main toggle button */}
            <button
              type="button"
              onClick={toggleAllCities}
              disabled={disabled}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isAllCitiesSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  isAllCitiesSelected ? 'bg-slate-950 border-slate-950 text-cyan-400' : 'border-slate-600'
                }`}
              >
                {isAllCitiesSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>Todas as cidades</span>
            </button>
          </div>

          {/* Group 1: Piauí (PI) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 tracking-wide">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Piauí (PI)
              </span>

              {/* Group shortcut: Todas as cidades do Piauí */}
              <button
                type="button"
                onClick={toggleAllPi}
                disabled={disabled}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  isAllPiSelected
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-emerald-300'
                }`}
              >
                {isAllPiSelected ? '✓ Todas do Piauí' : '+ Todas as cidades do Piauí'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
              {filteredPiCities.map((city) => {
                const isSelected = selectedCities.includes(city) || isAllCitiesSelected || isAllPiSelected;
                const isDirect = selectedCities.includes(city);

                return (
                  <label
                    key={city}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                      isDirect
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-semibold shadow-sm'
                        : isSelected
                        ? 'bg-slate-900 border-emerald-500/20 text-slate-300'
                        : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDirect}
                      onChange={() => toggleCity(city)}
                      disabled={disabled}
                      className="sr-only"
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isDirect
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : isSelected
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      {(isDirect || isSelected) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate">{city}</span>
                    {city === 'Teresina' && (
                      <span className="ml-auto text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-400">
                        Padrão
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Group 2: Maranhão (MA) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 tracking-wide">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                Maranhão (MA)
              </span>

              {/* Group shortcut: Todas as cidades do Maranhão */}
              <button
                type="button"
                onClick={toggleAllMa}
                disabled={disabled}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  isAllMaSelected
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-sky-300'
                }`}
              >
                {isAllMaSelected ? '✓ Todas do Maranhão' : '+ Todas as cidades do Maranhão'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
              {filteredMaCities.map((city) => {
                const isSelected = selectedCities.includes(city) || isAllCitiesSelected || isAllMaSelected;
                const isDirect = selectedCities.includes(city);

                return (
                  <label
                    key={city}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                      isDirect
                        ? 'bg-sky-950/40 border-sky-500/50 text-sky-200 font-semibold shadow-sm'
                        : isSelected
                        ? 'bg-slate-900 border-sky-500/20 text-slate-300'
                        : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDirect}
                      onChange={() => toggleCity(city)}
                      disabled={disabled}
                      className="sr-only"
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isDirect
                          ? 'bg-sky-500 border-sky-400 text-slate-950'
                          : isSelected
                          ? 'bg-sky-950 border-sky-500 text-sky-400'
                          : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      {(isDirect || isSelected) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate">{city}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Group 3: Cidades encontradas automaticamente no Themos Vagas */}
          {filteredExtraCities.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 tracking-wide">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Demais cidades encontradas no Themos Vagas ({filteredExtraCities.length})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                {filteredExtraCities.map((city) => {
                  const isSelected = selectedCities.includes(city) || isAllCitiesSelected;
                  const isDirect = selectedCities.includes(city);

                  return (
                    <label
                      key={city}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        isDirect
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 font-semibold shadow-sm'
                          : isSelected
                          ? 'bg-slate-900 border-indigo-500/20 text-slate-300'
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDirect}
                        onChange={() => toggleCity(city)}
                        disabled={disabled}
                        className="sr-only"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isDirect
                            ? 'bg-indigo-500 border-indigo-400 text-white'
                            : isSelected
                            ? 'bg-indigo-950 border-indigo-500 text-indigo-400'
                            : 'bg-slate-950 border-slate-700'
                        }`}
                      >
                        {(isDirect || isSelected) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{city}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
