/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar, NavViewMode } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { CustomerPortal } from './pages/CustomerPortal';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CeoTmPortal } from './pages/CeoTmPortal';
import { ProtectedSearchPortal } from './pages/ProtectedSearchPortal';

function MainApp() {
  const { 
    isAuthenticated, 
    isCustomerAuthenticated, 
    isCeoTmAuthenticated,
    isSearchOperatorAuthenticated,
    isStaffAuthorized,
    customerLogout, 
    logout 
  } = useAuth();
  const { ispProfile } = useCustomer();
  const { isDark } = useTheme();
  const [currentView, setCurrentView] = useState<NavViewMode>('home');

  const isCustomerMode = isCustomerAuthenticated && !isAuthenticated && !isCeoTmAuthenticated;

  const canSeeCeoPanel = Boolean(ispProfile.portalVisibility?.showCeoPanelToPublic) || 
    (!isCustomerMode && (isCeoTmAuthenticated || isStaffAuthorized));
  const canSeeAdminLogin = Boolean(ispProfile.portalVisibility?.showAdminLoginToPublic) || 
    (!isCustomerMode && (isAuthenticated || isCeoTmAuthenticated || isStaffAuthorized));
  const canSeeSearchPortal = Boolean(ispProfile.portalVisibility?.showSearchPortalToPublic) || 
    (!isCustomerMode && (isSearchOperatorAuthenticated || isAuthenticated || isCeoTmAuthenticated || isStaffAuthorized));

  // Automatically ensure views sync if auth state changes (e.g. logout)
  React.useEffect(() => {
    if (currentView === 'admin-dashboard' && !isAuthenticated) {
      setCurrentView('admin-login');
      return;
    }
    if (currentView === 'customer-portal' && !isCustomerAuthenticated) {
      setCurrentView('customer-login');
      return;
    }
  }, [currentView, isAuthenticated, isCustomerAuthenticated]);

  const handleNavigate = (view: NavViewMode) => {
    if (view === 'admin-dashboard' && !isAuthenticated) {
      setCurrentView('admin-login');
      return;
    }
    if (view === 'customer-portal' && !isCustomerAuthenticated) {
      setCurrentView('customer-login');
      return;
    }
    // If logged-in customer attempts to access administrative pages
    if (isCustomerMode && (view === 'ceo-tm' || view === 'admin-dashboard')) {
      setCurrentView('customer-portal');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in Admin Dashboard and authenticated
  if (currentView === 'admin-dashboard' && isAuthenticated) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-theme-black text-slate-100' : 'bg-theme-colorful text-slate-100'} antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-500`}>
        <AdminDashboard 
          onNavigatePublic={() => handleNavigate('home')} 
          onLogout={() => handleNavigate('admin-login')}
        />
      </div>
    );
  }

  // If in Customer Portal and customer is authenticated
  if (currentView === 'customer-portal' && isCustomerAuthenticated) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-theme-black text-slate-100' : 'bg-theme-colorful text-slate-100'} flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-500 relative`}>
        <div className="fixed inset-0 cyber-grid-overlay pointer-events-none opacity-40 z-0" />
        <div className="relative z-10 flex flex-col flex-1">
          <Navbar
            activeTab="customer-portal"
            onNavigate={handleNavigate}
          />
          <main className="flex-1">
            <CustomerPortal 
              onLogout={() => {
                customerLogout();
                handleNavigate('home');
              }} 
            />
          </main>
          <Footer onNavigate={handleNavigate} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-theme-black text-slate-100' : 'bg-theme-colorful text-slate-100'} flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-500 relative`}>
      {/* Ambient background glow effects */}
      <div className="fixed inset-0 cyber-grid-overlay pointer-events-none opacity-40 z-0" />
      
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar
          activeTab={currentView}
          onNavigate={handleNavigate}
        />

        <main className="flex-1">
          {currentView === 'ceo-tm' ? (
            <CeoTmPortal 
              onBackToHome={() => handleNavigate('home')}
              onNavigateToAdmin={() => handleNavigate(isAuthenticated ? 'admin-dashboard' : 'admin-login')}
            />
          ) : currentView === 'search' ? (
            <ProtectedSearchPortal
              onBackToHome={() => handleNavigate('home')}
              onNavigateToCustomerPortal={() => handleNavigate('customer-portal')}
            />
          ) : currentView === 'admin-login' || currentView === 'customer-login' || currentView === 'login' ? (
            <Login
              initialTab={currentView === 'admin-login' ? 'admin' : 'customer'}
              onSuccess={() => handleNavigate('admin-dashboard')}
              onCustomerSuccess={() => handleNavigate('customer-portal')}
              onBackToHome={() => handleNavigate('home')}
            />
          ) : (
            <Home 
              onNavigateToAdmin={() => handleNavigate(isAuthenticated ? 'admin-dashboard' : 'admin-login')}
              onNavigateToCustomerPortal={() => handleNavigate('customer-portal')}
              onNavigateToLogin={() => handleNavigate('customer-login')}
            />
          )}
        </main>

        <Footer onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CustomerProvider>
            <MainApp />
          </CustomerProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
