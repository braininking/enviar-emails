export interface JobVacancy {
  id: string;
  url: string;
  title: string;
  role: string;
  company?: string;
  city?: string;
  state?: string;
  locationRaw: string;
  publishedDate?: string;
  publishedAt?: string; // ISO: YYYY-MM-DDTHH:mm:ss
  publishedTimestamp?: number;
  deadline?: string;
  emails: string[];
  applicationSubject?: string;
  applicationSnippet?: string;
  hasEmail: boolean;
  status: 'success' | 'no_email' | 'error';
  errorMessage?: string;
}

export interface SearchStats {
  jobsFound: number;
  jobsAnalyzed: number;
  jobsWithEmail: number;
  emailsFound: number;
  emailsUnique: number;
  accessErrors: number;
  currentPage: number;
  totalPages: number;
}

export interface UniqueEmailMapping {
  email: string;
  jobCount: number;
  jobs: {
    id: string;
    title: string;
    url: string;
    publishedDate?: string;
    applicationSubject?: string;
  }[];
}

export interface SearchFilters {
  onlyWithEmail: boolean;
  includeRelated: boolean;
  maxPages: number;
}

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  term: string;
  location: string;
  selectedCities: string[];
  filters: SearchFilters;
  stats: SearchStats;
  jobs: JobVacancy[];
  allContacts: string[];
  uniqueEmails: UniqueEmailMapping[];
}
