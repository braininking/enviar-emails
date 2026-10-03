import { JobVacancy, SearchStats, UniqueEmailMapping } from '../types/job';

export interface StreamEventData {
  type?: 'page_start' | 'job_analyzed' | 'page_done' | 'info' | 'complete' | 'stopped' | 'error';
  message: string;
  stats?: SearchStats;
  currentJob?: JobVacancy;
  jobs?: JobVacancy[];
  uniqueEmails?: UniqueEmailMapping[];
  relatedTermsUsed?: string[];
  error?: string;
}

export interface StreamSearchCallbacks {
  onStart?: (msg: string) => void;
  onProgress?: (data: { message: string; stats: SearchStats; currentJob?: JobVacancy }) => void;
  onJobFound?: (job: JobVacancy) => void;
  onComplete?: (data: {
    message: string;
    stats: SearchStats;
    jobs: JobVacancy[];
    allContacts: string[];
    uniqueEmails: UniqueEmailMapping[];
    relatedTermsUsed?: string[];
  }) => void;
  onStopped?: (data: {
    message: string;
    stats: SearchStats;
    jobs: JobVacancy[];
    allContacts: string[];
    uniqueEmails: UniqueEmailMapping[];
  }) => void;
  onError?: (error: string) => void;
}

/**
 * Connects to the SSE stream endpoint to receive progressive live job scraping
 */
export async function streamJobSearch(
  params: {
    term: string;
    location?: string;
    cities?: string[];
    includeRelated?: boolean;
    maxPages?: number;
  },
  callbacks: StreamSearchCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const query = new URLSearchParams({
    term: params.term,
    location: params.location || 'Todas',
    includeRelated: params.includeRelated ? 'true' : 'false',
    maxPages: String(params.maxPages || 10),
  });

  if (params.cities && params.cities.length > 0) {
    query.set('cities', params.cities.join(','));
  }

  const url = `/api/jobs/stream?${query.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Erro ${response.status}`;
      try {
        const json = JSON.parse(errText);
        if (json.error) errorMsg = json.error;
      } catch {
        if (errText) errorMsg = errText;
      }
      callbacks.onError?.(errorMsg);
      return;
    }

    if (!response.body) {
      throw new Error('ReadableStream não suportado neste navegador.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      // Keep unfinished piece in buffer
      buffer = events.pop() || '';

      for (const eventBlock of events) {
        if (!eventBlock.trim()) continue;

        let eventType = 'message';
        let dataStr = '';

        const lines = eventBlock.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr += line.slice(6);
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);

          if (eventType === 'start') {
            callbacks.onStart?.(parsed.message || 'Iniciando pesquisa...');
          } else if (eventType === 'progress') {
            if (parsed.currentJob) {
              callbacks.onJobFound?.(parsed.currentJob);
            }
            if (parsed.stats) {
              callbacks.onProgress?.({
                message: parsed.message || '',
                stats: parsed.stats,
                currentJob: parsed.currentJob,
              });
            }
          } else if (eventType === 'complete') {
            callbacks.onComplete?.({
              message: parsed.message || 'Pesquisa concluída.',
              stats: parsed.stats,
              jobs: parsed.jobs || [],
              allContacts: parsed.allContacts || [],
              uniqueEmails: parsed.uniqueEmails || [],
              relatedTermsUsed: parsed.relatedTermsUsed,
            });
          } else if (eventType === 'stopped') {
            callbacks.onStopped?.({
              message: parsed.message || 'Pesquisa interrompida.',
              stats: parsed.stats,
              jobs: parsed.jobs || [],
              allContacts: parsed.allContacts || [],
              uniqueEmails: parsed.uniqueEmails || [],
            });
          } else if (eventType === 'error') {
            callbacks.onError?.(parsed.message || 'Ocorreu um erro na busca.');
          }
        } catch (jsonErr) {
          console.error('Failed to parse SSE event data:', dataStr, jsonErr);
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted || err.name === 'AbortError') {
      // Aborted by user
      return;
    }
    callbacks.onError?.(err.message || 'Erro na conexão com o servidor.');
  }
}

/**
 * Fetches suggested related search terms for a given query
 */
export async function fetchRelatedTerms(term: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/jobs/related-terms?term=${encodeURIComponent(term)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.terms || [];
  } catch {
    return [];
  }
}
