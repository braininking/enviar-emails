import React from 'react';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, onConnect, onDisconnect, isConnecting }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">Currículo Mail</h1>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% Gratuito
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Envie seus currículos de forma organizada pelo Gmail
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-full py-1.5 px-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400 hidden sm:inline">Gmail conectado:</span>
              <span className="text-xs font-semibold text-slate-200 max-w-[160px] truncate" title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              onClick={onDisconnect}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700/80"
              title="Desconectar Gmail"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-medium">Gmail não conectado</span>
            </div>
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              {isConnecting ? 'Conectando...' : 'Conectar Gmail'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
