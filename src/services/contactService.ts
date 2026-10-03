import { Recipient, EmailValidationSummary, DuplicateDetail } from '../types';
import * as XLSX from 'xlsx';

// Standard RFC 5322 compliant regex for basic structural validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Extracts and parses emails pasted from Ctrl+C / Ctrl+V
 * PRESERVES ALL ENTRIES. Never deletes or filters out duplicate or invalid emails.
 * Uses frequency map to identify duplicates without Set or filter deletion.
 */
export function parsePastedEmails(rawText: string): EmailValidationSummary {
  if (!rawText || !rawText.trim()) {
    return {
      total: 0,
      uniqueCount: 0,
      valid: 0,
      duplicateCount: 0,
      invalid: 0,
      list: [],
      duplicatesList: [],
      invalidList: [],
    };
  }

  // Tokenize by comma, semicolon, newline or carriage return
  const rawTokens = rawText
    .split(/[\r\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // 1. Build recipient objects for every single token preserving exact original order
  const list: Recipient[] = [];
  const emailFrequency: { [normalizedEmail: string]: number } = {};

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    // Check if token contains formatted email like "John Doe <john@doe.com>"
    const angleMatch = token.match(/<([^>]+)>/);
    const emailCandidate = (angleMatch ? angleMatch[1] : token).trim().toLowerCase();
    const displayName = angleMatch ? token.replace(/<[^>]+>/, '').trim().replace(/^["']|["']$/g, '') : undefined;
    const valid = isValidEmail(emailCandidate);

    if (valid) {
      emailFrequency[emailCandidate] = (emailFrequency[emailCandidate] || 0) + 1;
    }

    list.push({
      id: `rcp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      email: emailCandidate || token,
      name: displayName || '',
      status: 'pending',
      isValid: valid,
      isDuplicate: false, // will update below
      duplicateCount: 1,
    });
  }

  // 2. Identify duplicates and populate duplicate info without removing any item
  const seenCount: { [normalizedEmail: string]: number } = {};
  const duplicatesList: DuplicateDetail[] = [];
  const invalidList: Recipient[] = [];
  let duplicateCount = 0;
  let uniqueValidCount = 0;
  let validTotalCount = 0;

  for (const emailKey in emailFrequency) {
    uniqueValidCount++;
    const occurrences = emailFrequency[emailKey];
    if (occurrences > 1) {
      duplicatesList.push({
        email: emailKey,
        count: occurrences,
      });
      // Number of extra occurrences
      duplicateCount += (occurrences - 1);
    }
  }

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item.isValid) {
      invalidList.push(item);
    } else {
      validTotalCount++;
      const occurrences = emailFrequency[item.email] || 1;
      seenCount[item.email] = (seenCount[item.email] || 0) + 1;
      if (occurrences > 1) {
        item.isDuplicate = true;
        item.duplicateCount = occurrences;
      }
    }
  }

  return {
    total: list.length,
    uniqueCount: uniqueValidCount,
    valid: validTotalCount,
    duplicateCount,
    invalid: invalidList.length,
    list,
    duplicatesList,
    invalidList,
  };
}

/**
 * Parses XLSX / XLS / CSV / TXT file using SheetJS
 * PRESERVES ALL ROWS without automatic deduplication.
 */
export async function parseExcelOrCsvFile(file: File): Promise<{
  summary: EmailValidationSummary;
  rowsPreview: { empresa: string; email: string; cargo: string; nome: string; status: 'valid' | 'invalid' | 'duplicate'; occurrences: number }[];
  detectedColumns: string[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of arrays first to analyze headers
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawData || rawData.length === 0) {
    throw new Error('O arquivo selecionado está vazio.');
  }

  // Find header row or assume row 0
  let headerRowIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawData.length, 5); i++) {
    const row = rawData[i];
    if (Array.isArray(row) && row.some((cell) => typeof cell === 'string' && cell.trim().length > 0)) {
      headerRowIndex = i;
      headers = row.map((c) => String(c).trim());
      break;
    }
  }

  // Detect column indexes for email, empresa, cargo, nome
  let emailColIdx = -1;
  let empresaColIdx = -1;
  let cargoColIdx = -1;
  let nomeColIdx = -1;

  headers.forEach((h, idx) => {
    const normalized = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes('email') || normalized.includes('e-mail') || normalized.includes('contato')) {
      if (emailColIdx === -1) emailColIdx = idx;
    } else if (normalized.includes('empresa') || normalized.includes('company') || normalized.includes('organizacao') || normalized.includes('firma')) {
      if (empresaColIdx === -1) empresaColIdx = idx;
    } else if (normalized.includes('cargo') || normalized.includes('vaga') || normalized.includes('funcao') || normalized.includes('posicao') || normalized.includes('role')) {
      if (cargoColIdx === -1) cargoColIdx = idx;
    } else if (normalized.includes('nome') || normalized.includes('recrutador') || normalized.includes('responsavel') || normalized.includes('name')) {
      if (nomeColIdx === -1) nomeColIdx = idx;
    }
  });

  // If no column header specifically says "email", scan data rows to find the column that holds emails
  if (emailColIdx === -1) {
    for (let col = 0; col < (rawData[0]?.length || 0); col++) {
      let emailMatches = 0;
      for (let row = headerRowIndex; row < Math.min(rawData.length, headerRowIndex + 10); row++) {
        const val = String(rawData[row]?.[col] || '').trim();
        if (isValidEmail(val)) emailMatches++;
      }
      if (emailMatches > 0) {
        emailColIdx = col;
        break;
      }
    }
  }

  if (emailColIdx === -1) {
    throw new Error('Não foi possível identificar nenhuma coluna contendo e-mails válidos na planilha.');
  }

  const list: Recipient[] = [];
  const emailFrequency: { [normalizedEmail: string]: number } = {};

  // Process ALL rows after header without dropping duplicates
  for (let r = headerRowIndex + 1; r < rawData.length; r++) {
    const row = rawData[r];
    if (!row || row.length === 0) continue;

    const emailRaw = String(row[emailColIdx] || '').trim();
    if (!emailRaw) continue; // skip completely blank rows
    const emailClean = emailRaw.toLowerCase();
    const empresa = empresaColIdx !== -1 ? String(row[empresaColIdx] || '').trim() : '';
    const cargo = cargoColIdx !== -1 ? String(row[cargoColIdx] || '').trim() : '';
    const nome = nomeColIdx !== -1 ? String(row[nomeColIdx] || '').trim() : '';

    const valid = isValidEmail(emailClean);
    if (valid) {
      emailFrequency[emailClean] = (emailFrequency[emailClean] || 0) + 1;
    }

    list.push({
      id: `rcp_xl_${r}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: emailClean,
      company: empresa,
      role: cargo,
      name: nome,
      status: 'pending',
      isValid: valid,
      isDuplicate: false,
      duplicateCount: 1,
    });
  }

  let uniqueValidCount = 0;
  let duplicateCount = 0;
  const duplicatesList: DuplicateDetail[] = [];
  const invalidList: Recipient[] = [];
  const rowsPreview: { empresa: string; email: string; cargo: string; nome: string; status: 'valid' | 'invalid' | 'duplicate'; occurrences: number }[] = [];

  for (const emailKey in emailFrequency) {
    uniqueValidCount++;
    const occurrences = emailFrequency[emailKey];
    if (occurrences > 1) {
      duplicatesList.push({ email: emailKey, count: occurrences });
      duplicateCount += (occurrences - 1);
    }
  }

  let validTotalCount = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item.isValid) {
      invalidList.push(item);
      if (i < 50) {
        rowsPreview.push({
          empresa: item.company || '',
          email: item.email,
          cargo: item.role || '',
          nome: item.name || '',
          status: 'invalid',
          occurrences: 1,
        });
      }
    } else {
      validTotalCount++;
      const occurrences = emailFrequency[item.email] || 1;
      if (occurrences > 1) {
        item.isDuplicate = true;
        item.duplicateCount = occurrences;
      }
      if (i < 50) {
        rowsPreview.push({
          empresa: item.company || '',
          email: item.email,
          cargo: item.role || '',
          nome: item.name || '',
          status: occurrences > 1 ? 'duplicate' : 'valid',
          occurrences,
        });
      }
    }
  }

  return {
    summary: {
      total: list.length,
      uniqueCount: uniqueValidCount,
      valid: validTotalCount,
      duplicateCount,
      invalid: invalidList.length,
      list,
      duplicatesList,
      invalidList,
    },
    rowsPreview,
    detectedColumns: headers,
  };
}
