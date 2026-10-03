import { AttachmentFile } from '../types';

// Max attachment size limit: 15MB to comfortably stay within Gmail's 25MB total payload limit
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

/**
 * Format bytes to human readable string (e.g. 1,2 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = (bytes / Math.pow(k, i)).toFixed(1);
  return `${val.replace('.', ',')} ${sizes[i]}`;
}

/**
 * Reads a File and converts it to AttachmentFile with clean Base64 data
 */
export async function processAttachmentFile(file: File): Promise<AttachmentFile> {
  // Size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`O arquivo "${file.name}" ultrapassa o limite permitido de 15 MB.`);
  }

  // Read as arrayBuffer then convert to base64
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    dataBase64: base64,
  };
}
