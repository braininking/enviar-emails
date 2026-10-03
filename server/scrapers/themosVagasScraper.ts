import * as cheerio from 'cheerio';
import type { JobVacancy, SearchStats } from '../types/scraper.ts';
import { cacheService } from '../services/cacheService.ts';
import {
  extractEmails,
  extractApplicationSubject,
  extractDeadline,
  parseLocationFromTitle,
  parsePublicationDate,
  normalizeEmail,
  removeDuplicateEmails,
} from '../utils/normalizer.ts';

const ALLOWED_HOSTNAME = 'themosvagas.com.br';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ThemosVagasScraper {
  // Re-export utility methods to strictly satisfy the required interface
  public normalizeEmail = normalizeEmail;
  public removeDuplicateEmails = removeDuplicateEmails;
  public extractEmails = extractEmails;
  public extractApplicationSubject = extractApplicationSubject;

  /**
   * Validates if a URL is strictly within the allowed themosvagas domain
   */
  private validateUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname === ALLOWED_HOSTNAME || parsed.hostname.endsWith(`.${ALLOWED_HOSTNAME}`);
    } catch {
      return false;
    }
  }

  /**
   * Fetches the HTML of a specific job page or search results page
   * Handles timeouts, connection errors, 403, 404 gracefully
   */
  public async fetchJobPage(url: string, signal?: AbortSignal): Promise<string> {
    if (!this.validateUrl(url)) {
      throw new Error(`Domínio não autorizado: apenas ${ALLOWED_HOSTNAME} é permitido.`);
    }

    // Check memory cache
    const cached = cacheService.getHtml(url);
    if (cached) {
      return cached;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const onExternalAbort = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Página não encontrada (404)');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado (403)');
        }
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const html = await response.text();
      if (!html || html.trim().length === 0) {
        throw new Error('Conteúdo vazio retornado pelo servidor');
      }

      // Cache html response
      cacheService.setHtml(url, html);
      return html;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Tempo limite de conexão esgotado (timeout)');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  /**
   * Searches jobs on themosvagas.com.br for a given query and page number
   */
  public async searchJobs(
    query: string,
    page = 1,
    signal?: AbortSignal
  ): Promise<{
    jobs: Array<{ url: string; titleHint: string; dateHint?: string }>;
    totalPages: number;
    totalFoundHint?: number;
  }> {
    const encoded = encodeURIComponent(query.trim());
    const searchUrl =
      page === 1
        ? `https://${ALLOWED_HOSTNAME}/?s=${encoded}`
        : `https://${ALLOWED_HOSTNAME}/page/${page}/?s=${encoded}`;

    const html = await this.fetchJobPage(searchUrl, signal);
    const $ = cheerio.load(html);

    const jobs: Array<{ url: string; titleHint: string; dateHint?: string }> = [];

    // Articles contain individual vacancies
    $('article').each((_, el) => {
      const article = $(el);
      const titleLink = article.find('h2.entry-title a, h1.entry-title a').first();
      const href = titleLink.attr('href');
      const title = titleLink.text().trim();

      // Check date in article excerpt/header if present
      const dateText = article.find('.entry-date, time, .date').first().text().trim();
      const dateMatch = article.text().match(/(\d{2}\/\d{2}\/\d{4})/);
      const dateHint = dateText || (dateMatch ? dateMatch[1] : undefined);

      if (href && this.validateUrl(href)) {
        jobs.push({
          url: href,
          titleHint: title,
          dateHint,
        });
      }
    });

    // Detect total pages from WordPress pagination links
    let maxPage = 1;
    $('a.page-numbers, .pagination a, .nav-links a').each((_, el) => {
      const text = $(el).text().trim();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > maxPage) {
        maxPage = num;
      }
      const href = $(el).attr('href') || '';
      const match = href.match(/\/page\/(\d+)\//);
      if (match && parseInt(match[1], 10) > maxPage) {
        maxPage = parseInt(match[1], 10);
      }
    });

    return {
      jobs,
      totalPages: Math.max(maxPage, page),
    };
  }

  /**
   * Extracts all structured job details from a vacancy page
   */
  public extractJobData(html: string, url: string): JobVacancy {
    const $ = cheerio.load(html);

    // Extract title
    let rawTitle = $('h1.entry-title, h1.post-title').first().text().trim();
    if (!rawTitle) {
      rawTitle = $('title').text().split('|')[0].trim();
    }
    // Clean spaces
    const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();

    // Parse role and location
    const parts = cleanTitle.split('|').map((p) => p.trim());
    const role = parts[0] || cleanTitle;
    const locationInfo = parseLocationFromTitle(cleanTitle);

    // Look for article publication date and time
    const article = $('article').first();
    const articleHeader = article.find('.entry-header, header, .entry-meta').text();
    const metaPublishedTime =
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[property="og:updated_time"]').attr('content');
    const parsedPubDate = parsePublicationDate(
      articleHeader,
      article.html() || undefined,
      metaPublishedTime
    );
    const publishedDate = parsedPubDate.publishedDate;
    const publishedAt = parsedPubDate.publishedAt;
    const publishedTimestamp = parsedPubDate.publishedTimestamp;

    // Isolate job body content to prevent scraping site theme / footer / webmaster emails
    const contentEl = $('.entry-content').first();
    const contentHtml = contentEl.length ? contentEl.html() || '' : article.html() || '';
    const contentText = contentEl.length ? contentEl.text() : article.text();

    // Extract mailto links from inside content
    const mailtoHrefs: string[] = [];
    if (contentEl.length) {
      contentEl.find('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) mailtoHrefs.push(href);
      });
    } else {
      $('article a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) mailtoHrefs.push(href);
      });
    }

    // Extract emails
    const emails = this.extractEmails(contentText, mailtoHrefs);

    // Extract Subject (Assunto)
    const applicationSubject = this.extractApplicationSubject(contentText);

    // Extract Deadline (Prazo)
    const deadline = extractDeadline(contentText);

    // Extract Company if explicitly published
    let company: string | undefined;
    const companyMatch = contentText.match(/Empresa\s*[:\-–—]\s*([^\n\r<]{2,60})/i);
    if (companyMatch) {
      const cleanCompany = companyMatch[1].trim();
      if (!cleanCompany.toLowerCase().includes('não informada')) {
        company = cleanCompany;
      }
    }

    // Extract application context snippet (for preview of Currículos section)
    let applicationSnippet: string | undefined;
    const curriculosIdx = contentText.indexOf('Currículos');
    if (curriculosIdx !== -1) {
      applicationSnippet = contentText
        .slice(curriculosIdx, curriculosIdx + 300)
        .replace(/\s+/g, ' ')
        .trim();
    } else if (emails.length > 0) {
      const firstEmail = emails[0];
      const emailIdx = contentText.indexOf(firstEmail);
      if (emailIdx !== -1) {
        const start = Math.max(0, emailIdx - 100);
        const end = Math.min(contentText.length, emailIdx + 120);
        applicationSnippet = contentText.slice(start, end).replace(/\s+/g, ' ').trim();
      }
    }

    // Generate stable ID from full URL pathname
    let id = Buffer.from(url).toString('base64').slice(0, 16);
    try {
      const parsedUrl = new URL(url);
      const cleanPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
      if (cleanPath) id = cleanPath;
    } catch {
      // fallback
    }

    return {
      id,
      url,
      title: cleanTitle,
      role,
      company,
      city: locationInfo.city,
      state: locationInfo.state,
      locationRaw: locationInfo.raw,
      publishedDate,
      publishedAt,
      publishedTimestamp,
      deadline,
      emails,
      applicationSubject,
      applicationSnippet,
      hasEmail: emails.length > 0,
      status: emails.length > 0 ? 'success' : 'no_email',
    };
  }

  /**
   * Complete pipeline: Processes a single vacancy URL
   */
  public async processJobUrl(url: string, signal?: AbortSignal): Promise<JobVacancy> {
    // Check cached parsed job
    const cachedJob = cacheService.getJob(url);
    if (cachedJob) {
      return cachedJob;
    }

    try {
      const html = await this.fetchJobPage(url, signal);
      const job = this.extractJobData(html, url);
      cacheService.setJob(url, job);
      return job;
    } catch (err: any) {
      let id = Buffer.from(url).toString('base64').slice(0, 16);
      try {
        const parsedUrl = new URL(url);
        const cleanPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
        if (cleanPath) id = cleanPath;
      } catch {}

      return {
        id,
        url,
        title: url.replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '').replace(/-/g, ' '),
        role: 'Vaga',
        locationRaw: 'Não informada',
        emails: [],
        hasEmail: false,
        status: 'error',
        errorMessage: 'Não foi possível acessar esta vaga.',
      };
    }
  }
}

export const themosVagasScraper = new ThemosVagasScraper();
