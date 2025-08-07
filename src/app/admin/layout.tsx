import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-gray-100 border-r flex flex-col p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <a href="/admin" className="block w-full text-left py-2 px-4 rounded font-medium hover:bg-gray-200">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/admin/analytics" className="block w-full text-left py-2 px-4 rounded font-medium hover:bg-gray-200">
                Analytics
              </a>
            </li>
            <li>
              <div className="font-medium py-2 px-4">Klanten</div>
              <ul className="ml-4 space-y-1">
                <li>
                  <a href="/admin/customers" className="block w-full text-left py-1 px-4 rounded hover:bg-gray-200">
                    Klanten
                  </a>
                </li>
                <li>
                  <a href="/admin/crm" className="block w-full text-left py-1 px-4 rounded hover:bg-gray-200">
                    CRM
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <div className="font-medium py-2 px-4">Catalogus</div>
              <ul className="ml-4 space-y-1">
                <li>
                  <a href="/admin/products" className="block w-full text-left py-1 px-4 rounded hover:bg-gray-200">
                    Producten
                  </a>
                </li>
                <li>
                  <a href="/admin/categories" className="block w-full text-left py-1 px-4 rounded hover:bg-gray-200">
                    Categorieën
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <div className="font-medium py-2 px-4">Instellingen</div>
              <ul className="ml-4 space-y-1">
                <li>
                  <a href="/admin/settings" className="block w-full text-left py-1 px-4 rounded hover:bg-gray-200">
                    Algemene Instellingen
                  </a>
                </li>
                <li>
                  <a href="/admin/dhl-settings" className="block w-full text-left py-1 px-4 rounded hover:bg-gray-200">
                    DHL Instellingen
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <a href="/" className="block w-full text-left py-2 px-4 rounded font-medium hover:bg-gray-200">
            Terug naar Website
          </a>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 