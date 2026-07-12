import { useApp } from '../context/AppContext';

export const useAuth = () => {
  const { user, isAuthenticated, authLoading, login, logout } = useApp();
  
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const isAdmin = () => hasRole('admin');
  const isEsgManager = () => hasRole('esg_manager');
  const isDeptHead = () => hasRole('department_head');
  const isEmployee = () => hasRole('employee');
  const isAuditor = () => hasRole('auditor');

  return {
    user,
    isAuthenticated,
    loading: authLoading,
    login,
    logout,
    hasRole,
    isAdmin,
    isEsgManager,
    isDeptHead,
    isEmployee,
    isAuditor,
  };
};
