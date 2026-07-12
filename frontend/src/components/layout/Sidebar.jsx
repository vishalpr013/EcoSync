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
  Building,
  UserCheck,
  FolderOpen,
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
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#16171d] text-gray-300 border-r border-gray-800 transition-all duration-200 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-850">
        <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center font-bold text-white shrink-0 shadow-md">
          E
        </div>
        {!collapsed && (
          <span className="font-extrabold tracking-tight text-white text-lg">
            Eco<span className="text-indigo-400">Sync</span>
          </span>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 space-y-1.5 px-3 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors group
              ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'hover:bg-gray-800/60 hover:text-gray-150'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Current Profile Indicator */}
      <div className="p-3 border-t border-gray-850 bg-gray-950/20">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name}`}
            alt="Avatar"
            className="w-9 h-9 rounded-lg object-cover bg-gray-850 shrink-0"
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
  );
};

export default Sidebar;
