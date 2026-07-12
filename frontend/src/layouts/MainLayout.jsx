import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Loader } from '../components/ui/Overlays';

const MainLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-canvas min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Topbar and Content panel */}
      <div className={`transition-[padding] duration-300 min-h-screen flex flex-col ${sidebarCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-[15.5rem]'}`}>
        <Topbar 
          collapsed={sidebarCollapsed} 
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        {/* Main Content Area */}
        <main className="flex-1 pt-24 pb-28 lg:pb-10 px-4 sm:px-6 lg:px-8 max-w-[90rem] w-full mx-auto">
          <div className="page-enter"><Outlet /></div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
