import { JobVacancy } from '../types/job';

function escapeCsvCell(value?: string | number | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value).trim();
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Exports jobs list to a standard CSV file with UTF-8 BOM for Excel compatibility
 */
export function exportJobsToCsv(jobs: JobVacancy[], filename = 'vagas-themos-emails.csv'): void {
  const headers = [
    'Vaga',
    'Cargo',
    'Empresa',
    'Cidade',
    'Estado',
    'E-mail',
    'Assunto',
    'Data da publicação',
    'Prazo',
    'URL da vaga',
  ];

  const rows: string[] = [headers.join(';')];

  for (const job of jobs) {
    if (job.emails.length > 0) {
      for (const email of job.emails) {
        rows.push(
          [
            escapeCsvCell(job.title),
            escapeCsvCell(job.role),
            escapeCsvCell(job.company || 'Não informada'),
            escapeCsvCell(job.city || ''),
            escapeCsvCell(job.state || ''),
            escapeCsvCell(email),
            escapeCsvCell(job.applicationSubject || ''),
            escapeCsvCell(job.publishedDate || ''),
            escapeCsvCell(job.deadline || ''),
            escapeCsvCell(job.url),
          ].join(';')
        );
      }
    } else {
      rows.push(
        [
          escapeCsvCell(job.title),
          escapeCsvCell(job.role),
          escapeCsvCell(job.company || 'Não informada'),
          escapeCsvCell(job.city || ''),
          escapeCsvCell(job.state || ''),
          escapeCsvCell('Nenhum e-mail encontrado'),
          escapeCsvCell(job.applicationSubject || ''),
          escapeCsvCell(job.publishedDate || ''),
          escapeCsvCell(job.deadline || ''),
          escapeCsvCell(job.url),
        ].join(';')
      );
    }
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
