import { useApp } from '../context/AppContext';

export const useNotifications = () => {
  const { 
    notifications, 
    unreadNotifsCount, 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useApp();

  return {
    notifications,
    unreadCount: unreadNotifsCount,
    fetchNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
  };
};
