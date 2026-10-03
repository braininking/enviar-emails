import React from 'react';
import {
  LayoutDashboard,
  MailPlus,
  Inbox,
  FileText,
  Settings,
  Shield,
  Search,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'new_campaign' | 'campaigns' | 'templates' | 'vagas_finder' | 'settings' | 'privacy';

interface SidebarProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  campaignsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onChangeTab, campaignsCount }) => {
  const menuItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_campaign' as NavTab, label: 'Nova campanha', icon: MailPlus, highlight: true },
    { id: 'campaigns' as NavTab, label: 'Campanhas', icon: Inbox, badge: campaignsCount },
    { id: 'templates' as NavTab, label: 'Modelos', icon: FileText },
    { id: 'vagas_finder' as NavTab, label: 'Buscar Vagas (Themos)', icon: Search },
    { id: 'settings' as NavTab, label: 'Configurações', icon: Settings },
    { id: 'privacy' as NavTab, label: 'Privacidade', icon: Shield },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Menu Principal
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              } ${item.highlight && !isActive ? 'border border-blue-500/20 text-blue-300' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <h4 className="text-xs font-semibold text-white">Currículo Mail</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Envio profissional de currículos respeitando limites oficiais do Gmail.
          </p>
        </div>
      </div>
    </aside>
  );
};
