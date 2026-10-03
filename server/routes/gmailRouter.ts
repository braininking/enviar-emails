import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const USERINFO_SCOPES = ['openid', 'email', 'profile'];
const SESSION_COOKIE = 'curriculo_mail_gmail_session';
const STATE_COOKIE = 'curriculo_mail_gmail_oauth_state';
const SESSION_MAX_AGE = 60 * 60 * 24 * 180;
const STATE_MAX_AGE = 10 * 60;

type GmailSession = {
  refreshToken: string;
  email: string;
  name?: string;
  picture?: string;
};

function isProduction(req: Request) {
  return process.env.NODE_ENV === 'production' || req.secure;
}

function getSecret(): Buffer {
  const secret = process.env.GMAIL_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GMAIL_SESSION_SECRET não configurado.');
    }
    return crypto.createHash('sha256').update('curriculo-mail-dev-only-secret').digest();
  }

  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(value: string): string {
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decrypt(value: string): string | null {
  try {
    const raw = Buffer.from(value, 'base64url');
    if (raw.length < 28) return null;

    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', getSecret(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const result: Record<string, string> = {};

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    result[key] = decodeURIComponent(value);
  }

  return result;
}

function appendCookie(res: Response, name: string, value: string, maxAge: number, httpOnly = true) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ];

  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');

  res.append('Set-Cookie', parts.join('; '));
}

function clearCookie(res: Response, name: string) {
  appendCookie(res, name, '', 0);
}

function getAppUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;

  const protocol = req.headers['x-forwarded-proto']?.toString().split(',')[0] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host']?.toString() || req.get('host');
  if (!host) throw new Error('Não foi possível determinar a URL do aplicativo.');
  return `${protocol}://${host}`;
}

function getRedirectUri(req: Request): string {
  return (
    process.env.GMAIL_REDIRECT_URI?.trim() ||
    `${getAppUrl(req)}/api/gmail/oauth/callback`
  );
}

function getClientId(): string {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GMAIL_CLIENT_ID não configurado.');
  return clientId;
}

function getClientSecret(): string {
  const secret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error('GMAIL_CLIENT_SECRET não configurado.');
  return secret;
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    return new URL(origin).host === req.get('host');
  } catch {
    return false;
  }
}

function requireSameOrigin(req: Request, res: Response): boolean {
  if (isSameOrigin(req)) return true;
  res.status(403).json({ error: 'Origem não autorizada.' });
  return false;
}

async function exchangeCode(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Falha ao trocar o código OAuth.');
  }

  return data as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
}

async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    const error = data.error || '';
    const message =
      error === 'invalid_grant'
        ? 'A autorização do Gmail expirou ou foi revogada. Conecte o Gmail novamente.'
        : (data.error_description || error || 'Não foi possível renovar a autorização do Gmail.');

    const err = new Error(message);
    (err as any).code = error === 'invalid_grant' ? 'GMAIL_REAUTH_REQUIRED' : 'GMAIL_TOKEN_REFRESH_FAILED';
    throw err;
  }

  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
}

async function getUserInfo(accessToken: string) {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.email) {
    throw new Error('Não foi possível identificar a conta Google autorizada.');
  }

  return {
    email: data.email as string,
    name: (data.name || data.email.split('@')[0]) as string,
    picture: data.picture as string | undefined,
  };
}

function readSession(req: Request): GmailSession | null {
  const cookies = parseCookies(req);
  const encrypted = cookies[SESSION_COOKIE];
  if (!encrypted) return null;

  const json = decrypt(encrypted);
  if (!json) return null;

  try {
    const session = JSON.parse(json) as GmailSession;
    if (!session.refreshToken || !session.email) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(res: Response, session: GmailSession) {
  appendCookie(res, SESSION_COOKIE, encrypt(JSON.stringify(session)), SESSION_MAX_AGE);
}

router.get('/status', async (req, res) => {
  const session = readSession(req);

  if (!session) {
    res.json({ connected: false });
    return;
  }

  res.json({
    connected: true,
    email: session.email,
    name: session.name,
    picture: session.picture,
  });
});

router.get('/oauth/start', (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString('base64url');
    const redirectUri = getRedirectUri(req);

    appendCookie(res, STATE_COOKIE, encrypt(state), STATE_MAX_AGE);

    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [GMAIL_SCOPE, ...USERINFO_SCOPES].join(' '),
      access_type: 'offline',
      prompt: 'consent select_account',
      include_granted_scopes: 'true',
      state,
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (error: any) {
    res.status(500).send(error.message || 'Não foi possível iniciar a autorização do Gmail.');
  }
});

router.get('/oauth/callback', async (req, res) => {
  const appUrl = getAppUrl(req);

  try {
    const cookies = parseCookies(req);
    const expectedState = cookies[STATE_COOKIE] ? decrypt(cookies[STATE_COOKIE]) : null;
    const receivedState = typeof req.query.state === 'string' ? req.query.state : null;

    if (!expectedState || !receivedState || expectedState !== receivedState) {
      clearCookie(res, STATE_COOKIE);
      res.status(400).send('Falha de segurança: estado OAuth inválido. Inicie a conexão novamente.');
      return;
    }

    clearCookie(res, STATE_COOKIE);

    if (typeof req.query.error === 'string') {
      res.redirect(`${appUrl}/?gmail=denied&reason=${encodeURIComponent(req.query.error)}`);
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) throw new Error('O Google não retornou o código de autorização.');

    const tokens = await exchangeCode(code, getRedirectUri(req));

    if (!tokens.refresh_token) {
      throw new Error(
        'O Google não retornou um refresh token. Revogue a autorização anterior da conta e tente conectar novamente.'
      );
    }

    if (!tokens.access_token) {
      throw new Error('O Google não retornou um access token.');
    }

    const profile = await getUserInfo(tokens.access_token);

    saveSession(res, {
      refreshToken: tokens.refresh_token,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    res.redirect(`${appUrl}/?gmail=connected`);
  } catch (error: any) {
    console.error('[Gmail OAuth] Callback error:', error);
    res.redirect(`${appUrl}/?gmail=error&reason=${encodeURIComponent(error.message || 'Falha na autorização')}`);
  }
});

router.post('/disconnect', (req, res) => {
  if (!requireSameOrigin(req, res)) return;
  clearCookie(res, SESSION_COOKIE);
  res.json({ success: true });
});

router.post('/send', async (req, res) => {
  if (!requireSameOrigin(req, res)) return;

  const session = readSession(req);
  if (!session) {
    res.status(401).json({
      error: 'Gmail não conectado.',
      code: 'GMAIL_NOT_CONNECTED',
    });
    return;
  }

  const rawBase64Url = typeof req.body?.rawBase64Url === 'string' ? req.body.rawBase64Url : '';
  if (!rawBase64Url) {
    res.status(400).json({ error: 'Mensagem MIME não informada.' });
    return;
  }

  try {
    const tokens = await refreshAccessToken(session.refreshToken);

    if (tokens.refresh_token && tokens.refresh_token !== session.refreshToken) {
      saveSession(res, { ...session, refreshToken: tokens.refresh_token });
    }

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawBase64Url }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error?.message || `Erro HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(message);
      (err as any).status = response.status;
      throw err;
    }

    res.json(data);
  } catch (error: any) {
    const code = error.code || (error.message?.includes('autorização do Gmail') ? 'GMAIL_REAUTH_REQUIRED' : 'GMAIL_SEND_FAILED');
    const status = code === 'GMAIL_REAUTH_REQUIRED' ? 401 : 502;

    if (code === 'GMAIL_REAUTH_REQUIRED') {
      clearCookie(res, SESSION_COOKIE);
    }

    res.status(status).json({
      error: error.message || 'Não foi possível enviar o e-mail.',
      code,
    });
  }
});

export const gmailRouter = router;
