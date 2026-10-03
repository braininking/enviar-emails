import type { JobVacancy } from '../types/scraper.ts';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class MemoryCacheService {
  private jobCache = new Map<string, CacheItem<JobVacancy>>();
  private htmlCache = new Map<string, CacheItem<string>>();
  private defaultTTL = 30 * 60 * 1000; // 30 minutes

  // Job vacancy cache
  getJob(url: string): JobVacancy | null {
    const item = this.jobCache.get(url);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.jobCache.delete(url);
      return null;
    }
    return item.value;
  }

  setJob(url: string, job: JobVacancy, ttl = this.defaultTTL): void {
    // Keep cache bounded
    if (this.jobCache.size > 2000) {
      const oldestKey = this.jobCache.keys().next().value;
      if (oldestKey) this.jobCache.delete(oldestKey);
    }
    this.jobCache.set(url, {
      value: job,
      expiresAt: Date.now() + ttl,
    });
  }

  // HTML page cache
  getHtml(url: string): string | null {
    const item = this.htmlCache.get(url);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.htmlCache.delete(url);
      return null;
    }
    return item.value;
  }

  setHtml(url: string, html: string, ttl = 10 * 60 * 1000): void {
    if (this.htmlCache.size > 500) {
      const oldestKey = this.htmlCache.keys().next().value;
      if (oldestKey) this.htmlCache.delete(oldestKey);
    }
    this.htmlCache.set(url, {
      value: html,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.jobCache.clear();
    this.htmlCache.clear();
  }
}

export const cacheService = new MemoryCacheService();
