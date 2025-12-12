import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SupplierPage } from './pages/SupplierPage';
import { ProductPage } from './pages/ProductPage';
import { ClientsPage } from './pages/ClientsPage';
import { OrdersPage } from './pages/OrdersPage';
import { SalesPage } from './pages/SalesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { Toast } from './components/Toast';
import { ViewState, Notification, User } from './types';
import { db } from './services/db';

import { DashboardPage } from './pages/DashboardPage';

import { UsersPage } from './pages/UsersPage';

// --- Main App Component ---

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [notification, setNotification] = useState<Notification | null>(null);

  const [authView, setAuthView] = useState<'login' | 'forgot-password'>('login');

  const handleNotify = (n: Notification) => {
    setNotification(n);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard'); // Reset view on logout
    setAuthView('login');
  };

  if (!user) {
    // Default: Register Allowed (Managers)
    // ?mode=login -> Register Disabled (Collaborators)
    const isLoginMode = new URLSearchParams(window.location.search).get('mode') === 'login';

    const authContent = authView === 'forgot-password'
      ? <ForgotPasswordPage onBack={() => setAuthView('login')} onNotify={handleNotify} />
      : <LoginPage
        onLogin={handleLogin}
        onForgotPassword={() => setAuthView('forgot-password')}
        onNotify={handleNotify}
        allowRegister={!isLoginMode}
      />;

    return (
      <>
        {authContent}
        <Toast notification={notification} onClose={() => setNotification(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Layout currentView={currentView} setView={setCurrentView} onLogout={handleLogout} user={user}>
        {currentView === 'dashboard' && <DashboardPage setView={setCurrentView} />}
        {currentView === 'suppliers' && (
          <SupplierPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} user={user} />
        )}
        {currentView === 'products' && (
          <ProductPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} filter="all" user={user} />
        )}
        {currentView === 'clients' && (
          <ClientsPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} user={user} />
        )}
        {currentView === 'products-low-stock' && (
          <ProductPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} filter="lowStock" user={user} />
        )}
        {currentView === 'products-expiring' && (
          <ProductPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} filter="expiring" user={user} />
        )}
        {currentView === 'orders' && (
          <OrdersPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} />
        )}
        {currentView === 'sales' && (
          <SalesPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} />
        )}
        {currentView === 'reports' && user.role === 'ADMIN' && (
          <ReportsPage />
        )}
        {currentView === 'settings' && user.role === 'ADMIN' && (
          <SettingsPage onNotify={handleNotify} goBack={() => setCurrentView('dashboard')} />
        )}
        {currentView === 'users' && user.role === 'ADMIN' && (
          <UsersPage onNotify={handleNotify} />
        )}
      </Layout>
      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

export default App;