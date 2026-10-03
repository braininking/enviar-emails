import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with workspace scopes for Gmail sending and profile
export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Force account picker and consent screen to ensure Gmail permission is granted
provider.setCustomParameters({
  prompt: 'consent select_account',
  access_type: 'offline',
});

let isSigningIn = false;
let cachedAccessToken: string | null = sessionStorage.getItem('curriculo_mail_access_token');

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('curriculo_mail_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; profile: UserProfile } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google OAuth. Verifique se autorizou o envio de e-mails.');
    }
    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('curriculo_mail_access_token', credential.accessToken);
    const profile: UserProfile = {
      email: result.user.email || '',
      name: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário',
      picture: result.user.photoURL || undefined,
    };
    return { user: result.user, accessToken: cachedAccessToken, profile };
  } catch (error: any) {
    console.error('Erro ao conectar Gmail via OAuth:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem('curriculo_mail_access_token');
  }
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem('curriculo_mail_access_token');
};
