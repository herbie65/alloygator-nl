import React from "react";

interface AdminSidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onNavigate }) => {
  return (
    <aside className="w-64 h-screen bg-gray-100 border-r flex flex-col p-4">
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'dashboard' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('orders')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'orders' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Bestellingen
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('invoices')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'invoices' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Facturen
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('credit-invoices')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'credit-invoices' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Creditfacturen
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('returns')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'returns' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Retouren (RMA)
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('dhl')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'dhl' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              DHL Verzendingen
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('customers')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'customers' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Klanten
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('crm')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'crm' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              CRM
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('customer-groups')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'customer-groups' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Klantgroepen
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('categories')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'categories' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Categorieën
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('products')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'products' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Producten
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('header')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'header' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Header
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('uploads')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'uploads' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Uploads
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('cms')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'cms' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              CMS-pagina's
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('homepage')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'homepage' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Homepage
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('footer')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'footer' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Footer
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('settings')}
              className={`block w-full text-left py-2 px-4 rounded font-medium ${activeTab === 'settings' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
            >
              Instellingen
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar; 