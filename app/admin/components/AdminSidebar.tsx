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
            <ul className="ml-4 space-y-1 mt-1">
              <li>
                <button
                  onClick={() => onNavigate('invoices')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'invoices' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Facturen
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('credit-invoices')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'credit-invoices' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Creditfacturen
                </button>
              </li>
            </ul>
          </li>
          <li>
            <div className="font-medium py-2 px-4">Klanten</div>
            <ul className="ml-4 space-y-1">
              <li>
                <button
                  onClick={() => onNavigate('customers')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'customers' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Klanten
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('crm')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'crm' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  CRM
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('customer-groups')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'customer-groups' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Klantgroepen
                </button>
              </li>

            </ul>
          </li>
          <li>
            <div className="font-medium py-2 px-4">Catalogus</div>
            <ul className="ml-4 space-y-1">
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'categories' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Categorieën
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'products' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Producten
                </button>
              </li>
            </ul>
          </li>
          <li>
            <div className="font-medium py-2 px-4">Inhoud</div>
            <ul className="ml-4 space-y-1">
              <li>
                <button
                  onClick={() => onNavigate('header')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'header' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Header
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('uploads')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'uploads' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Uploads
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('cms')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'cms' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  CMS-pagina's
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('homepage')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'homepage' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Homepage
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('footer')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'footer' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Footer
                </button>
              </li>
            </ul>
          </li>
          <li>
            <div className="font-medium py-2 px-4">Instellingen</div>
            <ul className="ml-2 space-y-1">
              <li className="mt-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 px-4">Algemeen</div>
                <ul className="ml-2 mt-1 space-y-1">
                  <li>
                    <button onClick={() => onNavigate('settings')} className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'settings' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}>Algemene instellingen</button>
                  </li>
                  <li>
                    <button onClick={() => onNavigate('vat-settings')} className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'vat-settings' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}>BTW</button>
                  </li>
                  <li>
                    <button onClick={() => onNavigate('map-settings')} className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'map-settings' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}>Kaart</button>
                  </li>
                </ul>
              </li>
              <li className="mt-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 px-4">Verzending</div>
                <ul className="ml-2 mt-1 space-y-1">
                  <li>
                    <button onClick={() => onNavigate('shipping-settings')} className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'shipping-settings' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}>Verzendmethodes</button>
                  </li>
                  <li>
                    <button onClick={() => onNavigate('dhl-settings')} className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'dhl-settings' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}>DHL Parcel</button>
                  </li>
                </ul>
              </li>
              <li className="mt-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 px-4">Betalingen</div>
                <ul className="ml-2 mt-1 space-y-1">
                  <li>
                    <button onClick={() => onNavigate('payment-settings')} className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'payment-settings' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}>Betaalmethodes</button>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
          <li>
            <div className="font-medium py-2 px-4">Tools</div>
            <ul className="ml-4 space-y-1">
              <li>
                <button
                  onClick={() => onNavigate('database')}
                  className={`block w-full text-left py-1 px-4 rounded ${activeTab === 'database' ? 'bg-green-200 text-green-900' : 'hover:bg-gray-200'}`}
                >
                  Database Viewer
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar; 