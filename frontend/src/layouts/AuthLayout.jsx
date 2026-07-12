import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/ui/Overlays';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  // Redirect to dashboard if user is already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-950 p-4 transition-colors">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
