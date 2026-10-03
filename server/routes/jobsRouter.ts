import { Router, type Request, type Response } from 'express';
import { jobService } from '../services/jobService.ts';
import { getRelatedTerms } from '../utils/relatedTerms.ts';

export const jobsRouter = Router();

/**
 * GET /api/jobs/related-terms?term=...
 * Returns suggested related search terms
 */
jobsRouter.get('/related-terms', (req: Request, res: Response) => {
  const term = req.query.term as string;
  if (!term || typeof term !== 'string' || term.trim().length === 0) {
    res.json({ terms: [] });
    return;
  }
  const terms = getRelatedTerms(term.trim().slice(0, 80));
  res.json({ terms });
});

/**
 * GET /api/jobs/stream
 * Real-time SSE streaming of job search and email extraction
 */
jobsRouter.get('/stream', async (req: Request, res: Response) => {
  const rawTerm = req.query.term as string;
  const location = (req.query.location as string) || 'Todas';
  const includeRelated = req.query.includeRelated === 'true' || req.query.includeRelated === '1';
  const maxPages = parseInt(req.query.maxPages as string, 10) || 10;

  let cities: string[] = [];
  if (req.query.cities) {
    if (Array.isArray(req.query.cities)) {
      cities = req.query.cities.map((c) => String(c).trim()).filter(Boolean);
    } else if (typeof req.query.cities === 'string') {
      cities = (req.query.cities as string).split(',').map((c) => c.trim()).filter(Boolean);
    }
  }
  if (cities.length === 0 && location && location !== 'Todas' && location !== 'Todas as cidades') {
    cities = [location];
  }

  if (!rawTerm || typeof rawTerm !== 'string' || rawTerm.trim().length === 0) {
    res.status(400).json({ error: 'O termo de pesquisa é obrigatório.' });
    return;
  }

  const term = rawTerm.trim().slice(0, 100);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const abortController = new AbortController();

  req.on('close', () => {
    abortController.abort();
  });

  const sendEvent = (event: string, data: any) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('start', {
    message: `Iniciando pesquisa para "${term}"...`,
    term,
    location,
    cities,
    includeRelated,
  });

  try {
    const result = await jobService.searchJobsStreaming(
      {
        term,
        location,
        cities,
        includeRelated,
        maxPages,
      },
      {
        onProgress: (event) => {
          sendEvent('progress', event);
        },
      },
      abortController.signal
    );

    if (abortController.signal.aborted) {
      sendEvent('stopped', {
        message: 'Pesquisa interrompida pelo usuário.',
        stats: result.stats,
        jobs: result.jobs,
        allContacts: result.allContacts,
        uniqueEmails: result.uniqueEmails,
      });
    } else {
      sendEvent('complete', {
        message: 'Pesquisa concluída com sucesso.',
        stats: result.stats,
        jobs: result.jobs,
        allContacts: result.allContacts,
        uniqueEmails: result.uniqueEmails,
        relatedTermsUsed: result.relatedTermsUsed,
      });
    }
  } catch (err: any) {
    if (!abortController.signal.aborted) {
      sendEvent('error', {
        message: err.message || 'Erro durante a coleta das vagas.',
      });
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

/**
 * POST /api/jobs/search
 * Fallback standard REST endpoint
 */
jobsRouter.post('/search', async (req: Request, res: Response) => {
  const { term, location, cities, includeRelated, maxPages } = req.body || {};

  if (!term || typeof term !== 'string' || term.trim().length === 0) {
    res.status(400).json({ error: 'O termo de pesquisa é obrigatório.' });
    return;
  }

  try {
    const result = await jobService.searchJobsStreaming(
      {
        term: term.trim().slice(0, 100),
        location: location || 'Todas',
        cities: Array.isArray(cities) ? cities : undefined,
        includeRelated: Boolean(includeRelated),
        maxPages: parseInt(maxPages, 10) || 10,
      },
      {}
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Erro interno ao buscar vagas no Themos Vagas.',
    });
  }
});
