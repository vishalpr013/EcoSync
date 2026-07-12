import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import { Loader } from '../components/ui/Overlays';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const EnvironmentalPage = lazy(() => import('../pages/EnvironmentalPage'));
const SocialPage = lazy(() => import('../pages/SocialPage'));
const GovernancePage = lazy(() => import('../pages/GovernancePage'));
const GamificationPage = lazy(() => import('../pages/GamificationPage'));
const AICopilotPage = lazy(() => import('../pages/AICopilotPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Component to protect routes based on login and user roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null; // Layout handles outer loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Unauthorized roles are redirected to not found
    return <Navigate to="/404" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-950"><Loader /></div>}>
      <Routes>
        {/* Public/Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Authenticated Application Routes */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/environmental"
            element={
              <ProtectedRoute allowedRoles={['admin', 'esg_manager', 'department_head']}>
                <EnvironmentalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/social"
            element={
              <ProtectedRoute allowedRoles={['admin', 'esg_manager', 'department_head', 'employee']}>
                <SocialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/governance"
            element={
              <ProtectedRoute>
                <GovernancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamification"
            element={
              <ProtectedRoute allowedRoles={['admin', 'esg_manager', 'department_head', 'employee']}>
                <GamificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/copilot"
            element={
              <ProtectedRoute allowedRoles={['admin', 'esg_manager', 'employee']}>
                <AICopilotPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'esg_manager', 'department_head', 'auditor']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
