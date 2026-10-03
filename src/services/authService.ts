import { UserProfile } from '../types';

export interface GmailStatus {
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Server-side Gmail OAuth 2.0.
 *
 * The browser never receives or stores the Gmail access/refresh token.
 * The backend keeps the refresh token inside an encrypted HttpOnly cookie
 * and obtains a fresh access token when an email needs to be sent.
 */
export const initAuth = (
  onAuthSuccess?: (profile: UserProfile) => void,
  onAuthFailure?: () => void
) => {
  let cancelled = false;

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/gmail/status', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error('Falha ao consultar o Gmail.');

      const status: GmailStatus = await response.json();

      if (cancelled) return;

      if (status.connected && status.email) {
        onAuthSuccess?.({
          email: status.email,
          name: status.name || status.email.split('@')[0],
          picture: status.picture,
        });
      } else {
        onAuthFailure?.();
      }
    } catch (error) {
      console.error('[Gmail] Falha ao consultar status:', error);
      if (!cancelled) onAuthFailure?.();
    }
  };

  void loadStatus();

  return () => {
    cancelled = true;
  };
};

/**
 * Starts the OAuth authorization-code flow on the server.
 * Google handles the account selection and consent screen.
 */
export const googleSignIn = async (): Promise<null> => {
  window.location.assign('/api/gmail/oauth/start');
  return null;
};

export const getGmailStatus = async (): Promise<GmailStatus> => {
  const response = await fetch('/api/gmail/status', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Não foi possível consultar o status do Gmail.');
  }

  return response.json();
};

export const logout = async (): Promise<void> => {
  const response = await fetch('/api/gmail/disconnect', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Não foi possível desconectar o Gmail.');
  }
};
