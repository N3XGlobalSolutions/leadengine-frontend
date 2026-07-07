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
    <div className={`mb-6 border-b transition-colors duration-200 ${isDark ? 'border-slate-700/50 bg-slate-800/40 rounded-xl p-1' : 'border-gray-200 bg-white rounded-xl shadow-sm p-1'}`}>
      <nav className="flex flex-wrap gap-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const active = isActive(tab.path, tab.exact);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? isDark
                    ? 'text-indigo-400 bg-slate-700/70 shadow-sm'
                    : 'text-indigo-600 bg-indigo-50/70 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
