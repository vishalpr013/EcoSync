import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { dashboardService } from '../services/dashboardService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Auth state
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ecosync_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('ecosync_token');
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ecosync_theme') || 'light';
  });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Sync theme with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('ecosync_theme', theme);
  }, [theme]);

  // Check auth status on launch
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('ecosync_token');
      if (token) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Auth validation failed:", error);
          logout();
        }
      }
      setAuthLoading(false);
    };

    verifyAuth();

    // Listen to token refresh logout events from axios interceptor
    const handleLogoutEvent = () => {
      logout();
    };
    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, []);

  // Fetch notifications periodically if logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();

      // Poll notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadNotifsCount(0);
    }
  }, [isAuthenticated]);

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Notifications API actions
  const fetchNotifications = async () => {
    try {
      const res = await dashboardService.getNotifications({ page: 1, page_size: 20 });
      setNotifications(res.items || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await dashboardService.getUnreadNotificationsCount();
      setUnreadNotifsCount(res.unread_count || 0);
    } catch (err) {
      console.error("Error fetching unread notifications count:", err);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await dashboardService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await dashboardService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifsCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        authLoading,
        login,
        logout,
        theme,
        toggleTheme,
        notifications,
        unreadNotifsCount,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
