import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Mail,
  Search,
  Copy,
  Download,
  Send,
} from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { CityFilter } from '../components/CityFilter';
import { FiltersBar } from '../components/FiltersBar';
import { ProgressTracker } from '../components/ProgressTracker';
import { StatsOverview } from '../components/StatsOverview';
import { JobCard } from '../components/JobCard';
import { UniqueEmailsView } from '../components/UniqueEmailsView';
import { TableView } from '../components/TableView';
import {
  JobVacancy,
  SearchStats,
  UniqueEmailMapping,
  SearchFilters,
} from '../types/job';
import { streamJobSearch, fetchRelatedTerms } from '../services/api';
import { exportJobsToCsv } from '../utils/exportCsv';
import {
  copyToClipboard,
  copyUniqueEmailsList,
  copyAllContactsList,
  copyFormattedResults,
} from '../utils/clipboard';

const QUICK_SUGGESTIONS = [
  'Operador de Telemarketing',
  'Técnico de Informática',
  'Técnico de Enfermagem',
  'Auxiliar Administrativo',
  'Vendedor',
  'Recepcionista',
  'Motorista',
];

const INITIAL_STATS: SearchStats = {
  jobsFound: 0,
  jobsAnalyzed: 0,
  jobsWithEmail: 0,
  emailsFound: 0,
  emailsUnique: 0,
  accessErrors: 0,
  currentPage: 0,
  totalPages: 0,
};

function matchCityFrontend(job: JobVacancy, selectedCities: string[]): boolean {
  if (selectedCities.length === 0 || selectedCities.includes('Todas as cidades')) {
    return true;
  }

  const normJobCity = (job.city || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const jobState = (job.state || '').toUpperCase();
  const normRaw = (job.locationRaw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const normTitle = (job.title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  for (const city of selectedCities) {
    const normChoice = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (normChoice === 'todas as cidades do piaui') {
      if (jobState === 'PI') return true;
      const piauiCities = [
        'teresina', 'parnaiba', 'picos', 'floriano', 'piripiri', 'campo maior',
        'oeiras', 'barras', 'esperantina', 'pedro ii', 'altos', 'uniao',
        'jose de freitas', 'bom jesus', 'sao raimundo nonato', 'corrente', 'urucui', 'piaui'
      ];
      if (piauiCities.some((c) => normJobCity.includes(c) || normRaw.includes(c) || normTitle.includes(c))) {
        return true;
      }
    }

    if (normChoice === 'todas as cidades do maranhao') {
      if (jobState === 'MA') return true;
      const maranhaoCities = [
        'sao luis', 'imperatriz', 'timon', 'caxias', 'codo', 'bacabal', 'balsas', 'santa ines', 'maranhao'
      ];
      if (maranhaoCities.some((c) => normJobCity.includes(c) || normRaw.includes(c) || normTitle.includes(c))) {
        return true;
      }
    }

    if (normJobCity) {
      if (normJobCity === normChoice || normJobCity.includes(normChoice) || normChoice.includes(normJobCity)) {
        return true;
      }
    }

    if (!normJobCity) {
      const reg = new RegExp(`(?:\\b|\\|)${normChoice}(?:\\b|\\||\\-)`, 'i');
      if (reg.test(normRaw) || reg.test(normTitle)) {
        return true;
      }
    }
  }

  return false;
}

interface VagasSearchPageProps {
  onSendToCampaign: (emails: string[]) => void;
}

export const VagasSearchPage: React.FC<VagasSearchPageProps> = ({ onSendToCampaign }) => {
  const [term, setTerm] = useState('Operador de Telemarketing');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Teresina']);
  const [discoveredCities, setDiscoveredCities] = useState<string[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    onlyWithEmail: true,
    includeRelated: false,
    maxPages: 10,
  });

  const [relatedTerms, setRelatedTerms] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [stats, setStats] = useState<SearchStats>(INITIAL_STATS);

  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [allContacts, setAllContacts] = useState<string[]>([]);
  const [uniqueEmails, setUniqueEmails] = useState<UniqueEmailMapping[]>([]);
  const [currentJob, setCurrentJob] = useState<JobVacancy | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);

  const [viewMode, setViewMode] = useState<'cards' | 'unique_emails' | 'table'>('cards');
  const [searchFilterKeyword, setSearchFilterKeyword] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    if (term.trim().length >= 3) {
      fetchRelatedTerms(term).then((terms) => {
        if (active) setRelatedTerms(terms);
      });
    } else {
      setRelatedTerms([]);
    }
    return () => {
      active = false;
    };
  }, [term]);

  const handleStartSearch = async () => {
    if (!term.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSearching(true);
    setHasSearched(true);
    setSearchMessage('Iniciando varredura no Themos Vagas...');
    setStats(INITIAL_STATS);
    setJobs([]);
    setAllContacts([]);
    setUniqueEmails([]);
    setCurrentJob(undefined);

    try {
      await streamJobSearch(
        {
          term: term.trim(),
          includeRelated: filters.includeRelated,
          maxPages: filters.maxPages,
          cities: selectedCities,
        },
        {
          onStart: (msg) => {
            setSearchMessage(msg);
          },
          onProgress: (data) => {
            setSearchMessage(data.message);
            setStats(data.stats);
            if (data.currentJob) {
              setCurrentJob(data.currentJob);
            }
          },
          onJobFound: (job) => {
            const matchesCity = matchCityFrontend(job, selectedCities);
            if (job.city && !discoveredCities.includes(job.city)) {
              setDiscoveredCities((prev) => {
                if (prev.includes(job.city!)) return prev;
                return [...prev, job.city!].sort();
              });
            }
            if (matchesCity) {
              setJobs((prev) => {
                if (prev.some((j) => j.id === job.id)) return prev;
                return [job, ...prev];
              });
            }
          },
          onComplete: (data) => {
            setStats(data.stats);
            setJobs(data.jobs.filter((j) => matchCityFrontend(j, selectedCities)));
            setAllContacts(data.allContacts);
            setUniqueEmails(data.uniqueEmails);
            setSearchMessage('Varredura concluída com sucesso!');
            setIsSearching(false);
          },
          onStopped: (data) => {
            setStats(data.stats);
            setJobs(data.jobs.filter((j) => matchCityFrontend(j, selectedCities)));
            setAllContacts(data.allContacts);
            setUniqueEmails(data.uniqueEmails);
            setSearchMessage('Busca interrompida.');
            setIsSearching(false);
          },
          onError: (errMsg) => {
            setSearchMessage(`Erro na busca: ${errMsg}`);
            setIsSearching(false);
          },
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSearchMessage(`Erro inesperado: ${err.message || 'Falha na conexão'}`);
      }
      setIsSearching(false);
    }
  };

  const handleStopSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSearching(false);
    setSearchMessage('Busca cancelada pelo usuário.');
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filters.onlyWithEmail && (!job.emails || job.emails.length === 0)) {
        return false;
      }
      if (!matchCityFrontend(job, selectedCities)) {
        return false;
      }
      if (searchFilterKeyword.trim()) {
        const kw = searchFilterKeyword.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(kw);
        const matchEmail = (job.emails || []).some((e) => e.toLowerCase().includes(kw));
        const matchSnippet = (job.applicationSnippet || '').toLowerCase().includes(kw);
        return matchTitle || matchEmail || matchSnippet;
      }
      return true;
    });
  }, [jobs, filters.onlyWithEmail, selectedCities, searchFilterKeyword]);

  const uniqueEmailsStringList = useMemo(() => {
    return uniqueEmails.map((u) => u.email);
  }, [uniqueEmails]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900 border border-cyan-500/20 rounded-2xl p-6 sm:p-8">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Search className="w-3.5 h-3.5" /> Minerador de Vagas Themos
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Pesquise vagas abertas e envie currículos direto pelo Gmail
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Varra publicações do portal Themos Vagas em tempo real, extraia os e-mails de RH e recrutamento de Teresina, Piauí e Maranhão, e transfira para o disparador de campanhas com um único clique.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
        <SearchBar
          term={term}
          onTermChange={setTerm}
          selectedCities={selectedCities}
          onSearch={handleStartSearch}
          isSearching={isSearching}
          onStop={handleStopSearch}
          quickSuggestions={QUICK_SUGGESTIONS}
          onSelectSuggestion={(sug) => {
            setTerm(sug);
          }}
        />

        {/* City Filter */}
        <CityFilter
          selectedCities={selectedCities}
          onChange={setSelectedCities}
          discoveredCities={discoveredCities}
          disabled={isSearching}
        />

        {/* Search Options Bar */}
        <FiltersBar
          filters={filters}
          onChange={setFilters}
          disabled={isSearching}
          relatedTerms={relatedTerms}
          currentTerm={term}
        />
      </div>

      {/* Progress Tracker */}
      {(isSearching || hasSearched) && (
        <ProgressTracker
          isSearching={isSearching}
          message={searchMessage}
          stats={stats}
          currentJob={currentJob}
          onStop={handleStopSearch}
        />
      )}

      {/* Stats Overview & Transfer to Campaign Action */}
      {hasSearched && (
        <div className="space-y-4">
          <StatsOverview
            stats={stats}
            totalUniqueEmails={uniqueEmails.length}
            totalAllContacts={allContacts.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSearching={isSearching}
            onCopyUniqueEmails={() => copyUniqueEmailsList(uniqueEmailsStringList)}
            onCopyAllContacts={() => copyAllContactsList(allContacts)}
            onExportCsv={() => exportJobsToCsv(jobs, term)}
            onCopyResults={() => copyFormattedResults(jobs)}
            onNewSearch={() => {
              setJobs([]);
              setAllContacts([]);
              setUniqueEmails([]);
              setHasSearched(false);
            }}
          />

          {/* TRANSFER BAR */}
          {uniqueEmails.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-blue-600/10 border border-blue-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {uniqueEmails.length} e-mails de recrutadores encontrados!
                  </h4>
                  <p className="text-xs text-slate-300">
                    Deseja transferir esses e-mails para disparar sua candidatura personalizada com currículo em anexo?
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSendToCampaign(uniqueEmailsStringList)}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Disparar Currículos para estas {uniqueEmails.length} Vagas
              </button>
            </div>
          )}

          {/* Results Views Switcher & Export */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vagas Detalhadas ({filteredJobs.length})
              </button>
              <button
                onClick={() => setViewMode('unique_emails')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'unique_emails' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                E-mails Únicos ({uniqueEmails.length})
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tabela
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyUniqueEmailsList(uniqueEmailsStringList)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar E-mails Únicos
              </button>
              <button
                onClick={() => exportJobsToCsv(jobs, term)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </button>
            </div>
          </div>

          {/* View Content */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                  Nenhuma vaga encontrada para os filtros selecionados.
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onCopyEmail={(email) => copyToClipboard(email)}
                  />
                ))
              )}
            </div>
          )}

          {viewMode === 'unique_emails' && (
            <UniqueEmailsView
              uniqueEmails={uniqueEmails}
              onCopySingleEmail={(email) => copyToClipboard(email)}
              onCopyAllUnique={() => copyUniqueEmailsList(uniqueEmailsStringList)}
            />
          )}

          {viewMode === 'table' && (
            <TableView
              jobs={filteredJobs}
              onCopyEmail={(email) => copyToClipboard(email)}
            />
          )}
        </div>
      )}
    </div>
  );
};
