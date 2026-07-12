import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Leaf,
  Users,
  Award,
  FileText,
  MessageSquare,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ collapsed, toggleCollapse }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const role = user.role;

  // Configuration of navigation items per role permissions
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'esg_manager', 'department_head', 'employee', 'auditor'],
    },
    {
      label: 'Environmental',
      path: '/environmental',
      icon: Leaf,
      roles: ['admin', 'esg_manager', 'department_head'],
    },
    {
      label: 'Social Impact',
      path: '/social',
      icon: Users,
      roles: ['admin', 'esg_manager', 'department_head', 'employee'],
    },
    {
      label: 'Governance',
      path: '/governance',
      icon: ShieldCheck,
      roles: ['admin', 'esg_manager', 'department_head', 'employee', 'auditor'],
    },
    {
      label: 'Gamification',
      path: '/gamification',
      icon: Award,
      roles: ['admin', 'esg_manager', 'department_head', 'employee'],
    },
    {
      label: 'AI Copilot',
      path: '/copilot',
      icon: MessageSquare,
      roles: ['admin', 'esg_manager', 'employee'],
    },
    {
      label: 'Analytics & Reports',
      path: '/reports',
      icon: FileText,
      roles: ['admin', 'esg_manager', 'department_head', 'auditor'],
    },
    // Admin specific settings and collections
    {
      label: 'Administration',
      path: '/admin',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  // Filter items by role
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
    <aside
      className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-40 flex-col bg-[#0d1518] text-slate-300 border-r border-white/[0.06] transition-all duration-300 ease-out shadow-[12px_0_40px_rgba(2,8,10,0.12)]
        ${collapsed ? 'w-[4.5rem]' : 'w-[15.5rem]'}`}
    >
      {/* Brand Header */}
      <div className="h-[4.5rem] flex items-center gap-3 px-4 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_8px_24px_rgba(16,185,129,0.12)]">
          <Leaf className="w-5 h-5" strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <div><span className="font-bold tracking-[-0.03em] text-white text-lg">EcoSync</span><span className="block text-[9px] uppercase tracking-[0.2em] text-slate-500 mt-0.5">ESG Intelligence</span></div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-5 space-y-1 px-3 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group
              ${
                isActive
                  ? 'bg-white/[0.08] text-white shadow-[inset_3px_0_0_#34d399]'
                  : 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105" strokeWidth={1.8} />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Current Profile Indicator */}
      <div className="p-3 border-t border-white/[0.06] bg-black/10">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name}`}
            alt="Avatar"
            className="w-9 h-9 rounded-xl object-cover bg-slate-800 shrink-0 ring-1 ring-white/10"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-none mb-1">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500 font-medium capitalize truncate">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1518]/95 p-1.5 shadow-[0_16px_45px_rgba(2,8,10,0.35)] backdrop-blur-xl">
      {visibleItems.map((item) => (
        <NavLink key={item.path} to={item.path} aria-label={item.label} title={item.label} className={({ isActive }) => `min-w-0 flex-1 flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[9px] font-medium transition-colors ${isActive ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500 hover:text-slate-200'}`}>
          <item.icon className="w-[17px] h-[17px]" strokeWidth={1.9} />
          <span className="hidden sm:block max-w-[4rem] truncate">{item.label.split(' ')[0]}</span>
        </NavLink>
      ))}
    </nav>
    </>
  );
};

export default Sidebar;
