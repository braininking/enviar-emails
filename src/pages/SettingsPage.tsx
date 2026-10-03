import React from 'react';
import {
  HelpCircle,
  Key,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsPageProps {
  user: UserProfile | null;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onConnectGmail,
  onDisconnectGmail,
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const steps = [
    {
      title: 'Passo 1: Acessar o Google Cloud Console (Totalmente Gratuito)',
      desc: 'Acesse https://console.cloud.google.com/ com sua conta Google comum. Não é necessário assinar nada.',
    },
    {
      title: 'Passo 2: Criar um Projeto',
      desc: 'No topo da página, clique no seletor de projetos e clique em "Novo Projeto". Dê o nome de "Curriculo Mail" e clique em Criar.',
    },
    {
      title: 'Passo 3: Ativar a Gmail API',
      desc: 'No menu lateral esquerdo, vá em "APIs e serviços" > "Biblioteca" (Library). Pesquise por "Gmail API" e clique no botão azul "Ativar".',
    },
    {
      title: 'Passo 4: Tela de Permissão OAuth (Consent Screen)',
      desc: 'Vá em "APIs e serviços" > "Tela de permissão OAuth". Escolha tipo "Externo" (External). Digite o nome do app ("Currículo Mail") e seu e-mail. Adicione os escopos "gmail.send" e "userinfo.email". Em "Usuários de teste", adicione seu próprio endereço de e-mail.',
    },
    {
      title: 'Passo 5: Criar Credenciais OAuth (Aplicativo da Web)',
      desc: 'Vá em "Google Auth Platform" > "Clients" e crie um cliente OAuth do tipo "Web application". Em "Authorized redirect URIs", cadastre exatamente a URL do callback do servidor: https://SEU-DOMINIO/api/gmail/oauth/callback.',
    },
    {
      title: 'Passo 6: Configurar os Secrets do servidor',
      desc: 'Não coloque o Client Secret no GitHub. Cadastre os valores nos Secrets do ambiente de execução.',
      code: `GMAIL_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com\nGMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx\nGMAIL_REDIRECT_URI=https://seu-app-url.run.app/api/gmail/oauth/callback\nGMAIL_SESSION_SECRET=uma-chave-longa-e-aleatoria`,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Configurações & Integração Gmail</h2>
        <p className="text-xs text-slate-400">
          Gerencie a conexão da sua conta e veja o guia técnico de configuração OAuth 2.0.
        </p>
      </div>

      {/* Gratuidade Card */}
      <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">Este aplicativo é 100% Gratuito!</h3>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            Você <strong>não paga nada</strong>. O sistema utiliza a cota gratuita oficial da sua própria conta do Gmail concedida pelo Google (até <strong>500 e-mails por dia</strong> para contas comuns @gmail.com ou até 2.000 e-mails/dia para Google Workspace). Não há planos pagos, assinaturas ou cobranças.
          </p>
        </div>
      </div>

      {/* Account Status Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Status da Conexão Gmail</h3>
              <p className="text-xs text-slate-400">OAuth 2.0 no servidor • renovação automática da autorização</p>
            </div>
          </div>
          {user ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gmail conectado
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Gmail não conectado
            </span>
          )}
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Conta autenticada:</span>
            {user ? (
              <div>
                <span className="text-sm font-bold text-white font-mono">{user.email}</span>
                {user.name && <p className="text-xs text-slate-400">{user.name}</p>}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">
                Nenhum e-mail conectado. Clique ao lado para autorizar o envio.
              </span>
            )}
          </div>
          <div>
            {user ? (
              <button
                onClick={onDisconnectGmail}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Desconectar Conta
              </button>
            ) : (
              <button
                onClick={onConnectGmail}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Conectar Gmail Agora
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Passo a Passo Guia */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Guia Passo a Passo: Configuração do Gmail API</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Para que você possa enviar currículos pelo seu próprio remetente de forma segura, o sistema utiliza o fluxo oficial do Google OAuth 2.0. Abaixo está a documentação técnica para implantação externa:
        </p>

        <div className="space-y-4 pt-2">
          {steps.map((st, i) => (
            <div
              key={i}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
            >
              <h4 className="text-xs font-bold text-slate-200">{st.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              {st.code && (
                <div className="relative mt-2">
                  <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-blue-300 overflow-x-auto border border-slate-800">
                    {st.code}
                  </pre>
                  <button
                    onClick={() => copyText(st.code!, i)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === i ? (
                      <span className="text-emerald-400 text-[10px]">Copiado!</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
