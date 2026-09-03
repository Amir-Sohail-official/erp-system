import React, { useMemo, useState } from 'react';

import { CategoryPage } from './CategoryPage.jsx';
import { CustomerPage } from './CustomerPage.jsx';
import { Dashboard } from './Dashboard.jsx';
import { InventoryPage } from './InventoryPage.jsx';
import { PaymentPage } from './PaymentPage.jsx';
import { ProductPage } from './ProductPage.jsx';
import { PurchasePage } from './PurchasePage.jsx';
import { ReportsPage } from './ReportsPage.jsx';
import { SalePage } from './SalePage.jsx';
import { Sidebar } from './Sidebar.jsx';
import { SupplierPage } from './SupplierPage.jsx';
import { Topbar } from './Topbar.jsx';
import { UsersPage } from './UsersPage.jsx';
import { Card, EmptyState } from './ui.jsx';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣', path: '/dashboard' },
  { id: 'products', label: 'Products', icon: '◫', path: '/products', disabled: false },
  { id: 'categories', label: 'Categories', icon: '▤', path: '/categories', disabled: false },
  { id: 'customers', label: 'Customers', icon: '◌', path: '/customers', disabled: false },
  { id: 'suppliers', label: 'Suppliers', icon: '◍', path: '/suppliers', disabled: false },
  { id: 'sales', label: 'Sales', icon: '⟠', path: '/sales', disabled: false },
  { id: 'purchases', label: 'Purchases', icon: '◐', path: '/purchases', disabled: false },
  { id: 'payments', label: 'Payments', icon: '◈', path: '/payments', disabled: false },
  { id: 'inventory', label: 'Inventory', icon: '▦', path: '/inventory', disabled: false },
  { id: 'reports', label: 'Reports', icon: '▥', path: '/reports', disabled: false },
  { id: 'users', label: 'Users', icon: '◔', path: '/users' },
  { id: 'settings', label: 'Settings', icon: '⚙', path: '/settings', disabled: true },
];

export function ERPLayout({ user, route, navigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(() => {
    const routePath = route || '/dashboard';
    const matched = navItems.find((item) => item.path === routePath);
    return matched?.id || 'dashboard';
  }, [route]);

  const visibleItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.id === 'dashboard') return true;
      if (item.id === 'users') return user?.role?.name === 'Admin' || user?.role?.name === 'Manager';
      if (['products', 'categories', 'customers', 'suppliers', 'inventory', 'purchases', 'sales'].includes(item.id)) {
        return user?.role?.name === 'Admin' || user?.role?.name === 'Manager' || user?.role?.name === 'Salesman' || user?.role?.name === 'Inventory Manager' || user?.role?.name === 'Accountant';
      }
      return !item.disabled;
    });
  }, [user]);

  const renderContent = () => {
    if (route === '/categories') {
      return <CategoryPage user={user} />;
    }

    if (route === '/products' || route.startsWith('/products/')) {
      return <ProductPage user={user} route={route} navigate={navigate} />;
    }

    if (route === '/customers' || route.startsWith('/customers/')) {
      return <CustomerPage user={user} route={route} navigate={navigate} />;
    }

    if (route === '/suppliers' || route.startsWith('/suppliers/')) {
      return <SupplierPage user={user} route={route} navigate={navigate} />;
    }

    if (route === '/inventory' || route.startsWith('/inventory/')) {
      return <InventoryPage user={user} route={route} navigate={navigate} />;
    }

    if (route === '/purchases' || route.startsWith('/purchases/')) {
      return <PurchasePage user={user} route={route} navigate={navigate} />;
    }

    if (route === '/sales' || route.startsWith('/sales/')) {
      return <SalePage user={user} route={route} navigate={navigate} />;
    }

    if (route === '/payments' || route.startsWith('/payments/')) {
      return <PaymentPage route={route} navigate={navigate} />;
    }

    if (route === '/reports' || route.startsWith('/reports/')) {
      return <ReportsPage user={user} route={route} navigate={navigate} />;
    }

    switch (activeItem) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'users':
        return <UsersPage user={user} />;
      default:
        return (
          <Card title={navItems.find((item) => item.id === activeItem)?.label || 'Module'} subtitle="Future ERP module placeholder">
            <EmptyState
              title="This module is not implemented yet"
              description="The backend and frontend for this area will be added in a later increment, while the shell remains ready for it."
            />
          </Card>
        );
    }
  };

  return (
    <div className="erp-shell">
      <Sidebar
        items={visibleItems}
        activeItem={activeItem}
        onSelect={(next) => {
          const nextItem = navItems.find((item) => item.id === next);
          if (nextItem) {
            navigate(nextItem.path);
          }
          setMobileOpen(false);
        }}
        user={user}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="erp-main-panel">
        <Topbar
          user={user}
          onLogout={onLogout}
          onToggleSidebar={() => setMobileOpen((value) => !value)}
        />

        <main className="erp-page">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
