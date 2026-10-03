import type { JobVacancy, SearchStats, UniqueEmailMapping } from '../types/scraper.ts';
import { themosVagasScraper } from '../scrapers/themosVagasScraper.ts';
import { getRelatedTerms } from '../utils/relatedTerms.ts';
import { normalizeCityName } from '../utils/normalizer.ts';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function matchCity(job: JobVacancy, selectedCities?: string[], legacyLocation?: string): boolean {
  let cities = selectedCities;

  // If legacy location is provided and no cities array
  if ((!cities || cities.length === 0) && legacyLocation) {
    if (legacyLocation === 'Todas' || legacyLocation === 'Todo o Brasil') {
      return true;
    }
    cities = [legacyLocation];
  }

  // If no filter or "Todas as cidades" is present
  if (!cities || cities.length === 0 || cities.includes('Todas as cidades') || cities.includes('Todas')) {
    return true;
  }

  const jobCityNorm = normalizeCityName(job.city || '');
  const jobStateNorm = (job.state || '').toUpperCase();
  const jobTitleNorm = normalizeCityName(job.title || '');
  const jobRawNorm = normalizeCityName(job.locationRaw || '');

  for (const city of cities) {
    const normChoice = normalizeCityName(city);

    // Option: Todas as cidades do Piauí
    if (normChoice === 'todas as cidades do piaui' || normChoice === 'todo o piaui') {
      if (jobStateNorm === 'PI') return true;
      const piauiCities = [
        'teresina', 'parnaiba', 'picos', 'floriano', 'piripiri', 'campo maior',
        'oeiras', 'barras', 'esperantina', 'pedro ii', 'altos', 'uniao',
        'jose de freitas', 'bom jesus', 'sao raimundo nonato', 'corrente', 'urucui', 'piaui'
      ];
      if (piauiCities.some((c) => jobCityNorm.includes(c) || jobRawNorm.includes(c) || jobTitleNorm.includes(c))) {
        return true;
      }
    }

    // Option: Todas as cidades do Maranhão
    if (normChoice === 'todas as cidades do maranhao' || normChoice === 'todo o maranhao') {
      if (jobStateNorm === 'MA') return true;
      const maranhaoCities = [
        'sao luis', 'imperatriz', 'timon', 'caxias', 'codo', 'bacabal', 'balsas', 'santa ines', 'maranhao'
      ];
      if (maranhaoCities.some((c) => jobCityNorm.includes(c) || jobRawNorm.includes(c) || jobTitleNorm.includes(c))) {
        return true;
      }
    }

    // Specific city matching (e.g. Teresina, Parnaíba, Timon, Picos)
    if (jobCityNorm) {
      if (jobCityNorm === normChoice || jobCityNorm.includes(normChoice) || normChoice.includes(jobCityNorm)) {
        return true;
      }
    }

    // Check locationRaw and Title if city field was empty
    if (!jobCityNorm) {
      const reg = new RegExp(`(?:\\b|\\|)${normChoice}(?:\\b|\\||\\-)`, 'i');
      if (reg.test(jobRawNorm) || reg.test(jobTitleNorm)) {
        return true;
      }
    }
  }

  return false;
}

// Keep backwards compatibility alias
export const matchLocation = matchCity;

export function buildUniqueEmailMappings(jobs: JobVacancy[]): UniqueEmailMapping[] {
  const map = new Map<string, UniqueEmailMapping>();

  for (const job of jobs) {
    for (const email of job.emails) {
      const lower = email.toLowerCase().trim();
      if (!map.has(lower)) {
        map.set(lower, {
          email: lower,
          jobCount: 0,
          jobs: [],
        });
      }
      const record = map.get(lower)!;
      // Avoid duplicate job link in same email
      if (!record.jobs.some((j) => j.id === job.id)) {
        record.jobs.push({
          id: job.id,
          title: job.title,
          url: job.url,
          publishedDate: job.publishedDate,
          applicationSubject: job.applicationSubject,
        });
        record.jobCount = record.jobs.length;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.jobCount - a.jobCount);
}

export interface StreamCallbacks {
  onProgress?: (event: {
    type: 'page_start' | 'job_analyzed' | 'page_done' | 'info';
    message: string;
    stats: SearchStats;
    currentJob?: JobVacancy;
  }) => void;
}

export class JobService {
  /**
   * Performs an iterative deep search across multiple pages
   * Streams progress events as jobs are analyzed
   */
  public async searchJobsStreaming(
    params: {
      term: string;
      location?: string;
      cities?: string[];
      includeRelated?: boolean;
      maxPages?: number;
    },
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<{
    jobs: JobVacancy[];
    allContacts: string[];
    stats: SearchStats;
    uniqueEmails: UniqueEmailMapping[];
    relatedTermsUsed: string[];
  }> {
    const rawTerm = params.term.trim();
    const location = params.location || 'Todas';
    const includeRelated = Boolean(params.includeRelated);
    const maxPagesToScrape = Math.min(params.maxPages || 10, 20); // reasonable upper limit

    const termsToSearch = includeRelated ? getRelatedTerms(rawTerm) : [rawTerm];
    const visitedJobUrls = new Set<string>();
    const allJobs: JobVacancy[] = [];
    const allContacts: string[] = [];
    const uniqueEmailSet = new Set<string>();

    const stats: SearchStats = {
      jobsFound: 0,
      jobsAnalyzed: 0,
      jobsWithEmail: 0,
      emailsFound: 0,
      emailsUnique: 0,
      accessErrors: 0,
      currentPage: 0,
      totalPages: 1,
    };

    // Process each term (primary term first)
    for (let termIdx = 0; termIdx < termsToSearch.length; termIdx++) {
      if (signal?.aborted) break;

      const currentTerm = termsToSearch[termIdx];
      let page = 1;
      let totalPagesForTerm = 1;

      // Scrape up to maxPagesToScrape for the primary term, or 2 pages for secondary terms to be fast & polite
      const maxPagesForThisTerm = termIdx === 0 ? maxPagesToScrape : 2;

      while (page <= totalPagesForTerm && page <= maxPagesForThisTerm) {
        if (signal?.aborted) break;

        stats.currentPage = page;
        callbacks.onProgress?.({
          type: 'page_start',
          message: `Pesquisando vagas... Página ${page} de ${totalPagesForTerm}`,
          stats: { ...stats },
        });

        try {
          const searchResult = await themosVagasScraper.searchJobs(currentTerm, page, signal);
          totalPagesForTerm = searchResult.totalPages;
          stats.totalPages = Math.max(stats.totalPages, totalPagesForTerm);

          const newJobsOnPage = searchResult.jobs.filter((j) => !visitedJobUrls.has(j.url));
          stats.jobsFound += newJobsOnPage.length;

          for (const item of newJobsOnPage) {
            if (signal?.aborted) break;

            visitedJobUrls.add(item.url);

            // Polite delay between individual requests (150ms)
            await delay(150);

            const job = await themosVagasScraper.processJobUrl(item.url, signal);

            // Verify location / city criteria strictly on the vacancy announcement
            const matchesLoc = matchCity(job, params.cities, location);

            if (matchesLoc) {
              stats.jobsAnalyzed++;

              if (job.status === 'error') {
                stats.accessErrors++;
              } else if (job.hasEmail) {
                stats.jobsWithEmail++;
                for (const em of job.emails) {
                  allContacts.push(em);
                  uniqueEmailSet.add(em.toLowerCase().trim());
                }
                stats.emailsFound = allContacts.length;
              }

              stats.emailsUnique = uniqueEmailSet.size;
              allJobs.push(job);

              callbacks.onProgress?.({
                type: 'job_analyzed',
                message: `Vagas analisadas: ${stats.jobsAnalyzed} | Contatos encontrados: ${stats.emailsFound} | E-mails únicos: ${stats.emailsUnique}`,
                stats: { ...stats },
                currentJob: job,
              });
            }
          }

          callbacks.onProgress?.({
            type: 'page_done',
            message: `Página ${page} concluída`,
            stats: { ...stats },
          });

          page++;
          // Polite delay between pagination requests (250ms)
          await delay(250);
        } catch (err: any) {
          if (signal?.aborted) break;
          stats.accessErrors++;
          callbacks.onProgress?.({
            type: 'info',
            message: `Aviso na página ${page}: ${err.message || 'Erro de conexão'}`,
            stats: { ...stats },
          });
          break;
        }
      }
    }

    // Sort allJobs by publication date: mais recentes primeiro (newest first)
    allJobs.sort((a, b) => {
      const timeA = a.publishedTimestamp || (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
      const timeB = b.publishedTimestamp || (b.publishedAt ? new Date(b.publishedAt).getTime() : 0);
      return timeB - timeA;
    });

    const uniqueEmails = buildUniqueEmailMappings(allJobs);

    return {
      jobs: allJobs,
      allContacts,
      stats,
      uniqueEmails,
      relatedTermsUsed: termsToSearch,
    };
  }
}

export const jobService = new JobService();
