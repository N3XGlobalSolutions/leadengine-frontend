import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Megaphone, Cpu, Package, Calendar, MessageSquare, BarChart3 } from 'lucide-react';
import { useAdminTheme } from '../../../contexts/AdminThemeContext';

export const OutboundTabs: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const { isDark } = useAdminTheme();

  const tabs = [
    {
      name: 'Campaigns',
      path: `/admin/clients/${clientId}/outbound`,
      icon: Megaphone,
      exact: true,
    },
    {
      name: 'AI Settings',
      path: `/admin/clients/${clientId}/outbound/ai-settings`,
      icon: Cpu,
    },
    {
      name: 'Products',
      path: `/admin/clients/${clientId}/outbound/products`,
      icon: Package,
    },
    {
      name: 'Calendar Integration',
      path: `/admin/clients/${clientId}/outbound/calendar`,
      icon: Calendar,
    },
    {
      name: 'Conversations',
      path: `/admin/clients/${clientId}/outbound/conversations`,
      icon: MessageSquare,
    },
    {
      name: 'AI Analytics',
      path: `/admin/clients/${clientId}/outbound/analytics`,
      icon: BarChart3,
    },
  ];

  const isActive = (tabPath: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === tabPath;
    }
    return location.pathname.startsWith(tabPath);
  };

  return (
    <div className={`mb-6 p-1.5 rounded-2xl border overflow-x-auto scrollbar-none transition-colors duration-200 ${
      isDark
        ? 'bg-slate-900/90 border-slate-800'
        : 'bg-slate-100/80 border-slate-200/80'
    }`}>
      <nav className="flex items-center gap-1.5 min-w-max" aria-label="Outbound Tabs">
        {tabs.map((tab) => {
          const active = isActive(tab.path, tab.exact);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 whitespace-nowrap ${
                active
                  ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold'
              }`}
            >
              <Icon size={18} className={active ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
