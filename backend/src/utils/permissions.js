export const PERMISSIONS = {
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE: 'users.manage',

  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',

  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_READ: 'products.read',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_READ: 'suppliers.read',
  SUPPLIERS_UPDATE: 'suppliers.update',
  SUPPLIERS_DELETE: 'suppliers.delete',

  SALES_CREATE: 'sales.create',
  SALES_READ: 'sales.read',
  SALES_UPDATE: 'sales.update',
  SALES_DELETE: 'sales.delete',

  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_READ: 'purchases.read',
  PURCHASES_UPDATE: 'purchases.update',
  PURCHASES_DELETE: 'purchases.delete',

  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',

  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_READ: 'payments.read',

  REPORTS_READ: 'reports.read',
};


export const ROLE_DEFINITIONS = {

  // Admin has complete access
  Admin: Object.values(PERMISSIONS),


  // Manager manages the business operations
  Manager: [
    // Categories
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,

    // Products
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,

    // Customers
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_DELETE,

    // Suppliers
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.SUPPLIERS_DELETE,

    // Sales
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.SALES_DELETE,

    // Purchases
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_UPDATE,
    PERMISSIONS.PURCHASES_DELETE,

    // Inventory
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,

    // Payments
    PERMISSIONS.PAYMENTS_READ,

    // Reports
    PERMISSIONS.REPORTS_READ,
  ],


  // Salesman / Cashier works mainly with POS sales
  Salesman: [
    // Products - can see products
    PERMISSIONS.PRODUCTS_READ,

    // Categories - can see categories
    PERMISSIONS.CATEGORIES_READ,

    // Customers
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_UPDATE,

    // Sales
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_UPDATE,

    // Payments
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_READ,
  ],


  // Inventory Manager manages products and stock
  'Inventory Manager': [
    // Products
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE,

    // Categories
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE,

    // Inventory
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,

    // Suppliers - read only
    PERMISSIONS.SUPPLIERS_READ,

    // Purchases - read only
    PERMISSIONS.PURCHASES_READ,

    // Sales - read only
    PERMISSIONS.SALES_READ,
  ],


  // Purchase Officer manages suppliers and purchases
  'Purchase Officer': [
    // Suppliers
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.SUPPLIERS_DELETE,

    // Products - read only
    PERMISSIONS.PRODUCTS_READ,

    // Categories - read only
    PERMISSIONS.CATEGORIES_READ,

    // Purchases
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_UPDATE,
    PERMISSIONS.PURCHASES_DELETE,

    // Inventory - read only
    PERMISSIONS.INVENTORY_READ,

    // Payments - read only
    PERMISSIONS.PAYMENTS_READ,
  ],


  // Accountant handles financial information
  Accountant: [
    // Products - read only
    PERMISSIONS.PRODUCTS_READ,

    // Categories - read only
    PERMISSIONS.CATEGORIES_READ,

    // Customers - read only
    PERMISSIONS.CUSTOMERS_READ,

    // Suppliers - read only
    PERMISSIONS.SUPPLIERS_READ,

    // Sales - read only
    PERMISSIONS.SALES_READ,

    // Purchases - read only
    PERMISSIONS.PURCHASES_READ,

    // Inventory - read only
    PERMISSIONS.INVENTORY_READ,

    // Payments
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_READ,

    // Reports
    PERMISSIONS.REPORTS_READ,
  ],
};