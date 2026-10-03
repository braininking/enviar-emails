import * as cheerio from 'cheerio';

/**
 * Utility functions for extracting, normalizing, and cleaning vacancy data
 */

// Blacklisted addresses that belong to the CMS theme or site owner, not the job posting
const BLACKLISTED_EMAILS = new Set([
  'floromauel@gmail.com',
  'contato@themosvagas.com.br',
  'admin@themosvagas.com.br',
  'suporte@themosvagas.com.br',
  'themosvagas@gmail.com',
  'nome@empresa.com.br',
  'email@empresa.com.br',
  'recrutamento@empresa.com.br',
  'rh@empresa.com.br',
  'contato@empresa.com.br',
  'vagas@empresa.com.br',
  'exemplo@empresa.com.br',
  'seuemail@empresa.com.br',
  'wordpress@themosvagas.com.br',
]);

const GENERIC_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'css',
  'js',
  'woff',
  'woff2',
]);

/**
 * Strips HTML and normalizes email string
 */
export function normalizeEmail(rawEmail: string): string {
  if (!rawEmail) return '';
  return rawEmail
    .toLowerCase()
    .replace(/^mailto:/i, '')
    .replace(/[^\w\.\+\-\@]/g, '')
    .trim();
}

/**
 * Validates whether an email string is well-formed and not in blacklist
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const normalized = normalizeEmail(email);

  if (normalized.length < 6 || normalized.length > 100) return false;

  // Check RFC-compliant general email pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) return false;

  // Check blacklist
  if (BLACKLISTED_EMAILS.has(normalized)) return false;

  // Ensure domain is not an image or asset file extension
  const domainParts = normalized.split('@')[1]?.split('.') || [];
  const tld = domainParts[domainParts.length - 1];
  if (GENERIC_EXTENSIONS.has(tld)) return false;

  return true;
}

/**
 * Extracts all valid email addresses from text and mailto: tags
 */
export function extractEmails(text: string, mailtoHrefs: string[] = []): string[] {
  const found = new Set<string>();

  // 1. Process mailto links first
  for (const href of mailtoHrefs) {
    if (href.toLowerCase().startsWith('mailto:')) {
      const email = href.slice(7).split('?')[0];
      const normalized = normalizeEmail(email);
      if (isValidEmail(normalized)) {
        found.add(normalized);
      }
    }
  }

  // 2. Extract with regex from cleaned text
  if (text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    for (const match of matches) {
      const normalized = normalizeEmail(match);
      if (isValidEmail(normalized)) {
        found.add(normalized);
      }
    }
  }

  return Array.from(found);
}

/**
 * Extracts application subject line (assunto do e-mail) from vacancy announcement
 */
export function extractApplicationSubject(text: string): string | undefined {
  if (!text) return undefined;

  const patterns = [
    /(?:t[ií]tulo|assunto|no\s+assunto|com\s+o\s+t[ií]tulo|com\s+o\s+assunto)\s*[:\-–—]?\s*[“"']([^“"'\n\r]{2,60})[”"']/i,
    /(?:t[ií]tulo|assunto)\s*(?:do\s+e-?mail)?\s*[:\-–—]?\s*[“"']([^“"'\n\r]{2,60})[”"']/i,
    /assunto\s*[:\-–—]\s*([^\n\r<.,;]{2,60})/i,
    /t[ií]tulo\s*[:\-–—]\s*([^\n\r<.,;]{2,60})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let subj = match[1].trim();
      subj = subj
        .replace(/^[“"'\u201C\u2018\s]+/, '')
        .replace(/["”'\u201D\u2019.;,\s]+$/, '')
        .trim();

      if (
        subj.length >= 2 &&
        subj.length <= 60 &&
        !/^para\s+o\s+e-?mail/i.test(subj) &&
        !/^o\s+curr[ií]culo/i.test(subj) &&
        !/^at[eé]/i.test(subj)
      ) {
        return subj;
      }
    }
  }

  return undefined;
}

/**
 * Extracts submission deadline (prazo de envio)
 */
export function extractDeadline(text: string): string | undefined {
  if (!text) return undefined;

  const patterns = [
    /at[eé]\s+(?:o\s+dia\s+)?(\d{2}\/\d{2}\/\d{4})/i,
    /prazo(?:\s+final|\s+de\s+envio)?\s*[:\-–—]?\s*(\d{2}\/\d{2}\/\d{4})/i,
    /limite(?:\s+at[eé])?\s*[:\-–—]?\s*(\d{2}\/\d{2}\/\d{4})/i,
    /inscri[cç][oõ]es\s+at[eé]\s+(\d{2}\/\d{2}\/\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Strips accents and lowers string for safe comparison
 */
export function normalizeCityName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Known mapping of common cities to states in PI and MA for quick canonical normalization
 */
const KNOWN_CITY_STATES: Record<string, { city: string; state: string }> = {
  teresina: { city: 'Teresina', state: 'PI' },
  parnaiba: { city: 'Parnaíba', state: 'PI' },
  picos: { city: 'Picos', state: 'PI' },
  floriano: { city: 'Floriano', state: 'PI' },
  piripiri: { city: 'Piripiri', state: 'PI' },
  'campo maior': { city: 'Campo Maior', state: 'PI' },
  uniao: { city: 'União', state: 'PI' },
  'jose de freitas': { city: 'José de Freitas', state: 'PI' },
  altos: { city: 'Altos', state: 'PI' },
  esperantina: { city: 'Esperantina', state: 'PI' },
  oeiras: { city: 'Oeiras', state: 'PI' },
  'bom jesus': { city: 'Bom Jesus', state: 'PI' },
  'sao raimundo nonato': { city: 'São Raimundo Nonato', state: 'PI' },
  'pedro ii': { city: 'Pedro II', state: 'PI' },
  corrente: { city: 'Corrente', state: 'PI' },
  barras: { city: 'Barras', state: 'PI' },
  urucui: { city: 'Uruçuí', state: 'PI' },
  luzilandia: { city: 'Luzilândia', state: 'PI' },
  paulistana: { city: 'Paulistana', state: 'PI' },
  guadalupe: { city: 'Guadalupe', state: 'PI' },
  valenca: { city: 'Valença do Piauí', state: 'PI' },
  'valenca do piaui': { city: 'Valença do Piauí', state: 'PI' },

  // Maranhão
  'sao luis': { city: 'São Luís', state: 'MA' },
  imperatriz: { city: 'Imperatriz', state: 'MA' },
  timon: { city: 'Timon', state: 'MA' },
  caxias: { city: 'Caxias', state: 'MA' },
  codo: { city: 'Codó', state: 'MA' },
  bacabal: { city: 'Bacabal', state: 'MA' },
  balsas: { city: 'Balsas', state: 'MA' },
  'santa ines': { city: 'Santa Inês', state: 'MA' },
};

/**
 * Parses City and State from vacancy title and text
 */
export function parseLocationFromTitle(title: string): { city?: string; state?: string; raw: string } {
  if (!title) return { raw: 'Não especificada' };

  // First check if a known city is contained directly in the title
  const normTitle = normalizeCityName(title);
  for (const [key, val] of Object.entries(KNOWN_CITY_STATES)) {
    const reg = new RegExp(`(?:\\b|\\|)${key}(?:\\b|\\||\\-)`, 'i');
    if (reg.test(normTitle)) {
      return {
        city: val.city,
        state: val.state,
        raw: `${val.city} – ${val.state}`,
      };
    }
  }

  // Split by pipe
  const parts = title.split('|').map((p) => p.trim());
  if (parts.length > 1) {
    const locPart = parts[1];
    const locMatch = locPart.match(/^([^\-–—\/]+)\s*[\-–—\/]\s*([A-Za-z]{2})$/);
    if (locMatch) {
      const parsedCity = locMatch[1].trim();
      const parsedState = locMatch[2].trim().toUpperCase();
      return {
        city: parsedCity,
        state: parsedState,
        raw: `${parsedCity} – ${parsedState}`,
      };
    }

    return {
      city: locPart,
      raw: locPart,
    };
  }

  return { raw: 'Piauí / Brasil' };
}

/**
 * Deduplicates an array of emails
 */
export function removeDuplicateEmails(emails: string[]): string[] {
  return Array.from(new Set(emails.map((e) => e.toLowerCase().trim())));
}

export interface ParsedPublicationDate {
  publishedAt?: string; // ISO: YYYY-MM-DDTHH:mm:ss
  publishedDate?: string; // Formatted display: "29/09 18:07" or "29/09/2026"
  publishedTimestamp?: number;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in Brazilian local time (UTC-3)
 */
export function getBrazilDateString(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Extracts and normalizes the job publication date and time from vacancy HTML/header
 * Uses the date/time shown on the job post/site itself (e.g. 29/09 18:07).
 */
export function parsePublicationDate(
  headerText: string,
  articleHtml?: string,
  metaPublishedTime?: string
): ParsedPublicationDate {
  const cleanHeader = headerText.replace(/\s+/g, ' ').trim();

  // 1. Check for exact full date and time in header text: "29/09/2026 18:07"
  const matchFullDateTime = cleanHeader.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})/);
  if (matchFullDateTime) {
    const [, day, month, year, time] = matchFullDateTime;
    const [hour, min] = time.split(':');
    const iso = `${year}-${month}-${day}T${hour}:${min}:00`;
    const ts = new Date(`${iso}-03:00`).getTime();
    return {
      publishedAt: iso,
      publishedDate: `${day}/${month} ${time}`,
      publishedTimestamp: isNaN(ts) ? undefined : ts,
    };
  }

  // 2. Check for date and time without year: "29/09 18:07"
  const matchShortDateTime = cleanHeader.match(/(\d{2})\/(\d{2})\s+(\d{2}:\d{2})/);
  if (matchShortDateTime) {
    const [, day, month, time] = matchShortDateTime;
    const [hour, min] = time.split(':');
    const currentYear = new Date().getFullYear();
    const iso = `${currentYear}-${month}-${day}T${hour}:${min}:00`;
    const ts = new Date(`${iso}-03:00`).getTime();
    return {
      publishedAt: iso,
      publishedDate: `${day}/${month} ${time}`,
      publishedTimestamp: isNaN(ts) ? undefined : ts,
    };
  }

  // 3. Check meta article:published_time if present (e.g. "2026-09-29T14:12:11+00:00")
  if (metaPublishedTime) {
    const d = new Date(metaPublishedTime);
    if (!isNaN(d.getTime())) {
      // In Piauí/Maranhão timezone (UTC-3), adjust from UTC to local
      const localMs = d.getTime() - 3 * 60 * 60 * 1000;
      const localDate = new Date(localMs);
      const year = localDate.getUTCFullYear();
      const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(localDate.getUTCDate()).padStart(2, '0');
      const hour = String(localDate.getUTCHours()).padStart(2, '0');
      const min = String(localDate.getUTCMinutes()).padStart(2, '0');
      const iso = `${year}-${month}-${day}T${hour}:${min}:00`;

      // If header had a day/month, preserve it
      const headerDateMatch = cleanHeader.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      const displayDay = headerDateMatch ? headerDateMatch[1] : day;
      const displayMonth = headerDateMatch ? headerDateMatch[2] : month;

      return {
        publishedAt: iso,
        publishedDate: `${displayDay}/${displayMonth} ${hour}:${min}`,
        publishedTimestamp: d.getTime(), // Real UTC instant
      };
    }
  }

  // 4. Fallback: match date only without time "29/09/2026"
  const matchDateOnly = cleanHeader.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (matchDateOnly) {
    const [, day, month, year] = matchDateOnly;
    const iso = `${year}-${month}-${day}T00:00:00`;
    const ts = new Date(`${iso}-03:00`).getTime();
    return {
      publishedAt: iso,
      publishedDate: `${day}/${month}/${year}`,
      publishedTimestamp: isNaN(ts) ? undefined : ts,
    };
  }

  return {};
}

/**
 * Validates if a job vacancy was published within the selected time window
 * Strictly uses the publication date/time on the vacancy post, NEVER email receipt date.
 */
export function matchesDateFilter(
  job: { publishedAt?: string; publishedTimestamp?: number; publishedDate?: string },
  dateFilter?: string,
  customStartDate?: string,
  customEndDate?: string,
  now?: number
): boolean {
  if (!dateFilter || dateFilter === 'all' || dateFilter === 'Todas as datas') {
    return true;
  }

  // If no date could be extracted from page, don't discard
  if (!job.publishedAt && !job.publishedTimestamp && !job.publishedDate) {
    return true;
  }

  const currentTime = now || Date.now();

  // 1. Hoje: Da 00:00:00 de hoje até o momento atual (dia do calendário atual de Teresina/Brasil)
  if (dateFilter === 'today' || dateFilter === 'Hoje') {
    const todayStr = getBrazilDateString(currentTime);
    const jobDateStr = job.publishedAt ? job.publishedAt.slice(0, 10) : '';
    if (jobDateStr) {
      return jobDateStr === todayStr;
    }
    if (job.publishedDate) {
      const match = job.publishedDate.match(/(\d{2})\/(\d{2})/);
      if (match) {
        const [, d, m] = match;
        const [, tm, td] = todayStr.split('-');
        return d === td && m === tm;
      }
    }
    return false;
  }

  // Calculate job time in UTC ms for rolling periods
  let jobTime: number | undefined = job.publishedTimestamp;
  if (!jobTime && job.publishedAt) {
    const str = job.publishedAt.includes('+') || job.publishedAt.includes('-0')
      ? job.publishedAt
      : `${job.publishedAt}-03:00`;
    const parsed = new Date(str).getTime();
    if (!isNaN(parsed)) jobTime = parsed;
  }

  if (!jobTime || isNaN(jobTime)) {
    return true;
  }

  // 2. Últimas 24 horas: Do momento atual - 24 horas até o momento atual
  if (dateFilter === '24h' || dateFilter === 'Últimas 24 horas') {
    const start24h = currentTime - 24 * 60 * 60 * 1000;
    return jobTime >= start24h && jobTime <= currentTime + 60000;
  }

  // 3. Últimos 3 dias: Do momento atual - 3 dias até o momento atual
  if (dateFilter === '3d' || dateFilter === 'Últimos 3 dias') {
    const start3d = currentTime - 3 * 24 * 60 * 60 * 1000;
    return jobTime >= start3d && jobTime <= currentTime + 60000;
  }

  // 4. Últimos 7 dias: Do momento atual - 7 dias até o momento atual
  if (dateFilter === '7d' || dateFilter === 'Últimos 7 dias') {
    const start7d = currentTime - 7 * 24 * 60 * 60 * 1000;
    return jobTime >= start7d && jobTime <= currentTime + 60000;
  }

  // 5. Últimos 15 dias: Do momento atual - 15 dias até o momento atual
  if (dateFilter === '15d' || dateFilter === 'Últimos 15 dias') {
    const start15d = currentTime - 15 * 24 * 60 * 60 * 1000;
    return jobTime >= start15d && jobTime <= currentTime + 60000;
  }

  // 6. Últimos 30 dias: Do momento atual - 30 dias até o momento atual
  if (dateFilter === '30d' || dateFilter === 'Últimos 30 dias') {
    const start30d = currentTime - 30 * 24 * 60 * 60 * 1000;
    return jobTime >= start30d && jobTime <= currentTime + 60000;
  }

  // 7. Personalizado: Da 00:00:00 da data inicial até 23:59:59 da data final
  if (dateFilter === 'custom' || dateFilter === 'Personalizado') {
    let startLimit = 0;
    let endLimit = Infinity;

    if (customStartDate) {
      const s = new Date(`${customStartDate}T00:00:00-03:00`);
      if (!isNaN(s.getTime())) startLimit = s.getTime();
    }
    if (customEndDate) {
      const e = new Date(`${customEndDate}T23:59:59.999-03:00`);
      if (!isNaN(e.getTime())) endLimit = e.getTime();
    }

    return jobTime >= startLimit && jobTime <= endLimit;
  }

  return true;
}
