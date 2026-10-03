import { AttachmentFile, Recipient } from '../types';

/**
 * Replace placeholders like {{nome}}, {{empresa}}, {{cargo}}, {{email}}
 * Safe replacement that doesn't break if property is missing or undefined.
 */
export function personalizeText(text: string, recipient: Partial<Recipient>): string {
  if (!text) return '';
  return text
    .replace(/\{\{\s*nome\s*\}\}/gi, recipient.name || '')
    .replace(/\{\{\s*empresa\s*\}\}/gi, recipient.company || '')
    .replace(/\{\{\s*cargo\s*\}\}/gi, recipient.role || '')
    .replace(/\{\{\s*email\s*\}\}/gi, recipient.email || '');
}

/**
 * Encodes string to UTF-8 Base64URL safe for Gmail API
 */
export function base64UrlEncode(str: string): string {
  // Use TextEncoder to ensure proper UTF-8 handling (Portuguese accents, etc.)
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encode raw bytes (from Uint8Array) into base64
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Builds RFC 2822 MIME message including attachments and UTF-8 body
 */
export function createMimeMessage({
  to,
  from,
  subject,
  bodyHtml,
  bodyPlain,
  attachments = [],
}: {
  to: string;
  from: string;
  subject: string;
  bodyHtml?: string;
  bodyPlain: string;
  attachments?: AttachmentFile[];
}): string {
  const boundary = `====_NextPart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}====`;
  const mixedBoundary = attachments.length > 0 ? `====_MixedPart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}====` : null;

  // Encode Subject with RFC 2047 UTF-8 B
  const utf8SubjectBytes = new TextEncoder().encode(subject);
  let subjectBinary = '';
  for (let i = 0; i < utf8SubjectBytes.length; i++) {
    subjectBinary += String.fromCharCode(utf8SubjectBytes[i]);
  }
  const encodedSubject = `=?UTF-8?B?${btoa(subjectBinary)}?=`;

  const lines: string[] = [];
  lines.push(`From: ${from}`);
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${encodedSubject}`);
  lines.push(`MIME-Version: 1.0`);

  if (attachments.length > 0 && mixedBoundary) {
    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
    lines.push('');
    lines.push(`--${mixedBoundary}`);
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  } else {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  }

  // Plain text part
  lines.push('');
  lines.push(`--${boundary}`);
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(btoa(unescape(encodeURIComponent(bodyPlain))));

  // HTML part if present
  if (bodyHtml) {
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(btoa(unescape(encodeURIComponent(bodyHtml))));
  }

  lines.push('');
  lines.push(`--${boundary}--`);

  // Attachments part
  if (attachments.length > 0 && mixedBoundary) {
    for (const att of attachments) {
      lines.push('');
      lines.push(`--${mixedBoundary}`);
      lines.push(`Content-Type: ${att.mimeType || 'application/octet-stream'}; name="${att.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push('');
      // Clean base64 data and wrap in chunks of 76 characters
      const cleanBase64 = (att.dataBase64 || '').replace(/\s+/g, '');
      const chunks = cleanBase64.match(/.{1,76}/g) || [];
      lines.push(chunks.join('\r\n'));
    }
    lines.push('');
    lines.push(`--${mixedBoundary}--`);
  }

  const rawMime = lines.join('\r\n');
  return base64UrlEncode(rawMime);
}

/**
 * Send an email directly via Google Gmail API v1
 */
export async function sendGmailMessage({
  accessToken,
  rawBase64Url,
}: {
  accessToken: string;
  rawBase64Url: string;
}): Promise<{ id: string; threadId: string }> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawBase64Url,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `Erro HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json();
}
