import React, { ReactNode } from 'react';
import { ViewState, User } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  user: User;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, onLogout, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', view: 'dashboard' as ViewState },
    { id: 'products', label: 'Produtos', icon: 'inventory', view: 'products' as ViewState },
    { id: 'suppliers', label: 'Fornecedores', icon: 'local_shipping', view: 'suppliers' as ViewState },
    { id: 'clients', label: 'Clientes', icon: 'groups', view: 'clients' as ViewState },
    { id: 'orders', label: 'Pedidos', icon: 'description', view: 'orders' as ViewState },
    { id: 'sales', label: 'Vendas/Saídas', icon: 'shopping_cart_checkout', view: 'sales' as ViewState },
    // Admin Only Items
    ...(user.role === 'ADMIN' ? [
      { id: 'reports', label: 'Relatórios IA', icon: 'psychology', view: 'reports' as ViewState },
      { id: 'users', label: 'Usuários', icon: 'manage_accounts', view: 'users' as ViewState },
    ] : [])
  ];

  const handleSetView = (view: ViewState) => {
    setView(view);
    setIsSidebarOpen(false); // Close sidebar on selection (mobile)
  };

  return (
    <div className="relative flex h-screen w-full flex-col group/design-root overflow-hidden font-display bg-background-light dark:bg-background-dark text-[#111418] dark:text-gray-300">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#111418] border-b border-[#dbe0e6] dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">StockFlow</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">{isSidebarOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      <div className="flex flex-row h-full relative">
        {/* Backdrop for Mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SideNavBar */}
        <aside className={`
          fixed md:relative z-30 h-full
          w-64 bg-white dark:bg-background-dark border-r border-[#dbe0e6] dark:border-gray-700 
          p-4 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col gap-8 h-full overflow-y-auto">
            <div className="hidden md:flex items-center gap-2 px-2 cursor-pointer" onClick={() => handleSetView('dashboard')}>
              <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
              <h1 className="text-xl font-bold text-[#111418] dark:text-white">StockFlowAI</h1>
            </div>

            {/* User Info Badge */}
            <div className="px-2 pt-0 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-base">person</span>
                <div className="flex flex-col">
                  <span className="text-[#111418] dark:text-white font-bold">{user.name}</span>
                  <span className="text-[10px] uppercase tracking-wide">{user.role === 'ADMIN' ? 'Gestor' : 'Operador'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              {menuItems.map((item) => {
                const isEffectiveActive =
                  (item.id === 'suppliers' && currentView === 'suppliers') ||
                  (item.id === 'clients' && currentView === 'clients') ||
                  (item.id === 'orders' && currentView === 'orders') ||
                  (item.id === 'sales' && currentView === 'sales') ||
                  (item.id === 'products' && (currentView === 'products' || currentView === 'product-details')) ||
                  (item.id === 'dashboard' && currentView === 'dashboard') ||
                  (item.id === 'settings' && currentView === 'settings') ||
                  (item.id === 'users' && currentView === 'users');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSetView(item.view)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 w-full text-left
                        ${isEffectiveActive
                        ? 'bg-primary/20'
                        : 'hover:bg-primary/10'
                      }`}
                  >
                    <span className={`material-symbols-outlined ${isEffectiveActive ? 'fill text-primary dark:text-primary' : 'text-[#111418] dark:text-gray-300'}`}>
                      {item.icon}
                    </span>
                    <p className={`${isEffectiveActive ? 'text-primary' : 'text-[#111418] dark:text-gray-300'} text-sm font-medium leading-normal`}>
                      {item.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1 mt-auto">
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => handleSetView('settings')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 w-full text-left
                        ${currentView === 'settings' ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
                >
                  <span className={`material-symbols-outlined ${currentView === 'settings' ? 'fill text-primary dark:text-primary' : 'text-[#111418] dark:text-gray-300'}`}>settings</span>
                  <p className={`${currentView === 'settings' ? 'text-primary' : 'text-[#111418] dark:text-gray-300'} text-sm font-medium leading-normal`}>Configurações</p>
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors duration-200 w-full text-left"
              >
                <span className="material-symbols-outlined text-[#111418] dark:text-gray-300">logout</span>
                <p className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal">Sair</p>
              </button>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 bg-background-light dark:bg-background-dark overflow-x-hidden overflow-y-auto h-full w-full">
          {/* Changed max-w-4xl to max-w-7xl to match the wider product form design */}
          <div className="mx-auto max-w-7xl h-full flex flex-col pb-20 md:pb-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};