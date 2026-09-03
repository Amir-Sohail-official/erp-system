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
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '▣',
    path: '/dashboard',
  },
  {
    id: 'products',
    label: 'Products',
    icon: '◫',
    path: '/products',
    permission: 'products.read',
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: '▤',
    path: '/categories',
    permission: 'categories.read',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: '◌',
    path: '/customers',
    permission: 'customers.read',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: '◍',
    path: '/suppliers',
    permission: 'suppliers.read',
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: '⟠',
    path: '/sales',
    permission: 'sales.read',
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: '◐',
    path: '/purchases',
    permission: 'purchases.read',
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: '◈',
    path: '/payments',
    permission: 'payments.read',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: '▦',
    path: '/inventory',
    permission: 'inventory.read',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '▥',
    path: '/reports',
    permission: 'reports.read',
  },
  {
    id: 'users',
    label: 'Users',
    icon: '◔',
    path: '/users',
    permission: 'users.read',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙',
    path: '/settings',
    disabled: true,
  },
];


export function ERPLayout({ user, route, navigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);


  // Check whether the logged-in user has a specific permission
  const hasPermission = (permission) => {
    // Admin always has access
    if (user?.role?.name === 'Admin') {
      return true;
    }

    return user?.role?.permissions?.includes(permission) || false;
  };


  const activeItem = useMemo(() => {
    const routePath = route || '/dashboard';

    const matched = navItems.find((item) => {
      if (item.path === '/dashboard') {
        return routePath === '/dashboard';
      }

      return (
        routePath === item.path ||
        routePath.startsWith(`${item.path}/`)
      );
    });

    return matched?.id || 'dashboard';
  }, [route]);


  // Show only modules for which the user has READ permission
  const visibleItems = useMemo(() => {
    return navItems.filter((item) => {
      // Dashboard is available to all authenticated users
      if (item.id === 'dashboard') {
        return true;
      }

      // Disabled modules should not appear
      if (item.disabled) {
        return false;
      }

      // Module requires permission
      if (item.permission) {
        return hasPermission(item.permission);
      }

      return true;
    });
  }, [user]);


  // Get the permission required for a specific route
  const getRequiredPermission = (currentRoute) => {
    if (
      currentRoute === '/products' ||
      currentRoute?.startsWith('/products/')
    ) {
      return 'products.read';
    }

    if (currentRoute === '/categories') {
      return 'categories.read';
    }

    if (
      currentRoute === '/customers' ||
      currentRoute?.startsWith('/customers/')
    ) {
      return 'customers.read';
    }

    if (
      currentRoute === '/suppliers' ||
      currentRoute?.startsWith('/suppliers/')
    ) {
      return 'suppliers.read';
    }

    if (
      currentRoute === '/inventory' ||
      currentRoute?.startsWith('/inventory/')
    ) {
      return 'inventory.read';
    }

    if (
      currentRoute === '/purchases' ||
      currentRoute?.startsWith('/purchases/')
    ) {
      return 'purchases.read';
    }

    if (
      currentRoute === '/sales' ||
      currentRoute?.startsWith('/sales/')
    ) {
      return 'sales.read';
    }

    if (
      currentRoute === '/payments' ||
      currentRoute?.startsWith('/payments/')
    ) {
      return 'payments.read';
    }

    if (
      currentRoute === '/reports' ||
      currentRoute?.startsWith('/reports/')
    ) {
      return 'reports.read';
    }

    if (
      currentRoute === '/users' ||
      currentRoute?.startsWith('/users/')
    ) {
      return 'users.read';
    }

    return null;
  };


  const renderAccessDenied = () => {
    return (
      <Card
        title="Access Denied"
        subtitle="You do not have permission to access this module."
      >
        <EmptyState
          title="You don't have access"
          description="Your current role does not have permission to view this module. Please contact an administrator if you need access."
        />
      </Card>
    );
  };


  const renderContent = () => {
    const requiredPermission = getRequiredPermission(route);

    // Prevent users from accessing modules directly through the URL
    if (
      requiredPermission &&
      !hasPermission(requiredPermission)
    ) {
      return renderAccessDenied();
    }


    if (route === '/categories') {
      return <CategoryPage user={user} />;
    }


    if (
      route === '/products' ||
      route?.startsWith('/products/')
    ) {
      return (
        <ProductPage
          user={user}
          route={route}
          navigate={navigate}
        />
      );
    }


    if (
      route === '/customers' ||
      route?.startsWith('/customers/')
    ) {
      return (
        <CustomerPage
          user={user}
          route={route}
          navigate={navigate}
        />
      );
    }


    if (
      route === '/suppliers' ||
      route?.startsWith('/suppliers/')
    ) {
      return (
        <SupplierPage
          user={user}
          route={route}
          navigate={navigate}
        />
      );
    }


    if (
      route === '/inventory' ||
      route?.startsWith('/inventory/')
    ) {
      return (
        <InventoryPage
          user={user}
          route={route}
          navigate={navigate}
        />
      );
    }


    if (
      route === '/purchases' ||
      route?.startsWith('/purchases/')
    ) {
      return (
        <PurchasePage
          user={user}
          route={route}
          navigate={navigate}
        />
      );
    }


    if (
      route === '/sales' ||
      route?.startsWith('/sales/')
    ) {
      return (
        <SalePage
          user={user}
          route={route}
          navigate={navigate}
        />
      );
    }


    if (
      route === '/payments' ||
      route?.startsWith('/payments/')
    ) {
      return (
        <PaymentPage
          route={route}
          navigate={navigate}
        />
      );
    }


    if (
      route === '/reports' ||
      route?.startsWith('/reports/')
    ) {
      return (
        <ReportsPage
          user={user}
          route={route}
          navigate={navigate}
        />
      );
    }


    switch (activeItem) {
      case 'dashboard':
        return <Dashboard user={user} />;

      case 'users':
        return <UsersPage user={user} />;

      default:
        return (
          <Card
            title={
              navItems.find(
                (item) => item.id === activeItem
              )?.label || 'Module'
            }
            subtitle="Future ERP module placeholder"
          >
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
          const nextItem = navItems.find(
            (item) => item.id === next
          );

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
          onToggleSidebar={() =>
            setMobileOpen((value) => !value)
          }
        />


        <main className="erp-page">
          {renderContent()}
        </main>

      </div>

    </div>
  );
}