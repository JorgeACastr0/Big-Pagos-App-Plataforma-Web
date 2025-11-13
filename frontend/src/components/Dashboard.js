import React, { useState } from 'react';
import ClientsCRUD from './ClientsCRUD';
import InvoicesCRUD from './InvoicesCRUD';

function Dashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('clients');

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  const tabs = [
    { id: 'clients', name: 'Clientes', component: ClientsCRUD },
    { id: 'invoices', name: 'Facturas', component: InvoicesCRUD },
    { id: 'admins', name: 'Administradores', component: null },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-bigpagos-blue" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">BigPagos Admin</h1>
                <p className="text-sm text-gray-500">Panel de Administración</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-bigpagos-blue text-bigpagos-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {ActiveComponent ? (
            <ActiveComponent token={token} />
          ) : (
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-bigpagos-blue to-bigpagos-gray">
                <h3 className="text-lg font-semibold text-white">Administradores</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600">Funcionalidad de administradores próximamente disponible.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;