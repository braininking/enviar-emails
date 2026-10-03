import { JobVacancy } from '../types/job';

/**
 * Copies plain text to the clipboard with fallbacks
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Copies a list of unique emails, one per line (deduplicated)
 */
export async function copyUniqueEmailsList(emails: string[]): Promise<{ success: boolean; count: number }> {
  const unique = Array.from(new Set(emails.map((e) => e.toLowerCase().trim()))).filter(Boolean);
  if (unique.length === 0) return { success: false, count: 0 };
  const text = unique.join('\n');
  const success = await copyToClipboard(text);
  return { success, count: unique.length };
}

/**
 * Copies ALL contact occurrences found, one per line (without deduplication)
 */
export async function copyAllContactsList(emails: string[]): Promise<{ success: boolean; count: number }> {
  const all = emails.map((e) => e.trim()).filter(Boolean);
  if (all.length === 0) return { success: false, count: 0 };
  const text = all.join('\n');
  const success = await copyToClipboard(text);
  return { success, count: all.length };
}

/**
 * Copies full results in structured formatted text (ideal for pasting into docs/sheets)
 */
export async function copyFormattedResults(jobs: JobVacancy[]): Promise<boolean> {
  if (jobs.length === 0) return false;

  const lines: string[] = [];
  lines.push('VAGAS EMAIL FINDER - RESULTADOS DO THEMOS VAGAS');
  lines.push(`Total de vagas: ${jobs.length}`);
  lines.push('--------------------------------------------------\n');

  jobs.forEach((job, index) => {
    lines.push(`[${index + 1}] ${job.title}`);
    lines.push(`📍 Local: ${job.locationRaw || 'Piauí / Brasil'}`);
    if (job.emails.length > 0) {
      lines.push(`📧 E-mail(s): ${job.emails.join(', ')}`);
    } else {
      lines.push('📧 E-mail: Nenhum e-mail encontrado');
    }
    if (job.applicationSubject) {
      lines.push(`📝 Assunto: ${job.applicationSubject}`);
    }
    if (job.publishedDate) {
      lines.push(`📅 Publicada em: ${job.publishedDate}`);
    }
    if (job.deadline) {
      lines.push(`⏰ Prazo: ${job.deadline}`);
    }
    lines.push(`🔗 URL: ${job.url}\n`);
  });

  return await copyToClipboard(lines.join('\n'));
}
