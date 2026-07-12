import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, Sun, Moon, LogOut, Check, ChevronDown } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const Topbar = ({ collapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!user) return null;

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200/80 dark:bg-[#16171d] dark:border-gray-800 transition-all duration-200 flex items-center justify-between px-6
      ${collapsed ? 'left-16' : 'left-64'}`}>
      
      {/* Sidebar toggle */}
      <button 
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h10M4 18h16"} />
        </svg>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900 transition-colors"
          title="Toggle color theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#16171d]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3.5 flex flex-col gap-1 transition-colors hover:bg-gray-50/30 dark:hover:bg-gray-900/10 ${!notif.is_read ? 'bg-indigo-50/15 dark:bg-indigo-950/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{notif.title}</span>
                        {!notif.is_read && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="p-0.5 rounded text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                      <span className="text-[10px] text-gray-400 font-medium">{formatDateTime(notif.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name}`}
              alt="Profile"
              className="w-8 h-8 rounded-lg object-cover bg-gray-100"
            />
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{user.first_name} {user.last_name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
