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
    <div className="app-canvas relative min-h-screen flex items-center justify-center p-4 sm:p-8 transition-colors overflow-hidden">
      <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-emerald-300/10 blur-3xl soft-float" />
      <div className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-blue-300/10 blur-3xl soft-float" style={{ animationDelay: '-3s' }} />
      <div className="relative w-full max-w-5xl page-enter">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
