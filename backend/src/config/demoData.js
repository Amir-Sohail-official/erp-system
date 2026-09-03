import bcrypt from "bcryptjs";

import Category from "../models/Category.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import PurchaseItem from "../models/PurchaseItem.js";
import Role from "../models/Role.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Supplier from "../models/Supplier.js";
import User from "../models/User.js";
import inventoryService from "../services/inventoryService.js";
import Payment from "../models/Payment.js";

const productCatalog = [
  {
    name: "Dell Latitude 7440",
    sku: "DL-7440",
    barcode: "DL7440001",
    category: "Electronics",
    costPrice: 780,
    sellingPrice: 1200,
    stock: 18,
    minimumStock: 5,
    unit: "pcs",
  },
  {
    name: "HP DeskJet 2800",
    sku: "HP-2800",
    barcode: "HP2800001",
    category: "Electronics",
    costPrice: 95,
    sellingPrice: 180,
    stock: 25,
    minimumStock: 8,
    unit: "pcs",
  },
  {
    name: "Logitech Wireless Mouse",
    sku: "LG-MOUSE",
    barcode: "LGMOUSE01",
    category: "Electronics",
    costPrice: 18,
    sellingPrice: 42,
    stock: 60,
    minimumStock: 15,
    unit: "pcs",
  },
  {
    name: "Mechanical Keyboard",
    sku: "MK-KEY",
    barcode: "MKKEY0001",
    category: "Electronics",
    costPrice: 36,
    sellingPrice: 79,
    stock: 32,
    minimumStock: 10,
    unit: "pcs",
  },
  {
    name: "Classic Polo Shirt",
    sku: "POLO-XL",
    barcode: "POLOXL001",
    category: "Clothing",
    costPrice: 12,
    sellingPrice: 28,
    stock: 54,
    minimumStock: 12,
    unit: "pcs",
  },
  {
    name: "Cotton T-Shirt",
    sku: "TSHIRT-M",
    barcode: "TSHM00001",
    category: "Clothing",
    costPrice: 8,
    sellingPrice: 20,
    stock: 70,
    minimumStock: 18,
    unit: "pcs",
  },
  {
    name: "Leather Office Bag",
    sku: "BAG-LB",
    barcode: "BAGLB0001",
    category: "Accessories",
    costPrice: 55,
    sellingPrice: 120,
    stock: 12,
    minimumStock: 6,
    unit: "pcs",
  },
  {
    name: "Smart Watch Band",
    sku: "WATCH-BD",
    barcode: "WATCHBD01",
    category: "Accessories",
    costPrice: 14,
    sellingPrice: 34,
    stock: 44,
    minimumStock: 10,
    unit: "pcs",
  },
  {
    name: "Organic Rice 5kg",
    sku: "FOOD-RICE",
    barcode: "FOODRICE1",
    category: "Food",
    costPrice: 9,
    sellingPrice: 18,
    stock: 80,
    minimumStock: 20,
    unit: "bags",
  },
  {
    name: "Premium Coffee Beans",
    sku: "COFFEE-1",
    barcode: "COFFEE001",
    category: "Food",
    costPrice: 11,
    sellingPrice: 24,
    stock: 48,
    minimumStock: 12,
    unit: "bags",
  },
];

const customerSeed = [
  {
    name: "Alicia Morgan",
    email: "alicia@example.com",
    phone: "5551001001",
    address: "42 Oak Ave",
    city: "Seattle",
  },
  {
    name: "Noah Patel",
    email: "noah@example.com",
    phone: "5551001002",
    address: "15 Pine Rd",
    city: "Denver",
  },
  {
    name: "Emma Johnson",
    email: "emma@example.com",
    phone: "5551001003",
    address: "88 River St",
    city: "Austin",
  },
  {
    name: "Mason Lee",
    email: "mason@example.com",
    phone: "5551001004",
    address: "11 Cedar Lane",
    city: "Chicago",
  },
  {
    name: "Sofia Martinez",
    email: "sofia@example.com",
    phone: "5551001005",
    address: "7 Lakeview",
    city: "Miami",
  },
];

const supplierSeed = [
  {
    name: "NorthStar Tech",
    email: "sales@northstartech.com",
    phone: "5552002001",
    address: "120 Bay Blvd",
    city: "Boston",
  },
  {
    name: "Urban Apparel Co.",
    email: "orders@urbanapparel.com",
    phone: "5552002002",
    address: "220 Market St",
    city: "Miami",
  },
  {
    name: "Prime Accessories Ltd.",
    email: "support@primeaccessories.com",
    phone: "5552002003",
    address: "66 Industrial Rd",
    city: "Dallas",
  },
  {
    name: "FreshHarvest Foods",
    email: "buy@freshharvest.com",
    phone: "5552002004",
    address: "18 Greenfield",
    city: "Portland",
  },
  {
    name: "Office Essentials",
    email: "hello@officeessentials.com",
    phone: "5552002005",
    address: "500 Harbor Way",
    city: "New York",
  },
];

// ============================================================
// ROLE PERMISSIONS
// ============================================================

const roleSeed = [
  {
    name: "Admin",
    permissions: [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "users.manage",

      "categories.create",
      "categories.read",
      "categories.update",
      "categories.delete",

      "products.create",
      "products.read",
      "products.update",
      "products.delete",

      "customers.create",
      "customers.read",
      "customers.update",
      "customers.delete",

      "suppliers.create",
      "suppliers.read",
      "suppliers.update",
      "suppliers.delete",

      "sales.create",
      "sales.read",
      "sales.update",
      "sales.delete",

      "purchases.create",
      "purchases.read",
      "purchases.update",
      "purchases.delete",

      "inventory.read",
      "inventory.update",

      "payments.create",
      "payments.read",

      "reports.read",
    ],
  },

  {
    name: "Manager",
    permissions: [
      "categories.create",
      "categories.read",
      "categories.update",
      "categories.delete",

      "products.create",
      "products.read",
      "products.update",
      "products.delete",

      "customers.create",
      "customers.read",
      "customers.update",
      "customers.delete",

      "suppliers.create",
      "suppliers.read",
      "suppliers.update",
      "suppliers.delete",

      "sales.create",
      "sales.read",
      "sales.update",
      "sales.delete",

      "purchases.create",
      "purchases.read",
      "purchases.update",
      "purchases.delete",

      "inventory.read",
      "inventory.update",

      "payments.read",

      "reports.read",
    ],
  },

  {
    name: "Salesman",
    permissions: [
      "products.read",
      "categories.read",

      "customers.create",
      "customers.read",
      "customers.update",

      "sales.create",
      "sales.read",
      "sales.update",

      "payments.create",
      "payments.read",
    ],
  },

  {
    name: "Inventory Manager",
    permissions: [
      "products.create",
      "products.read",
      "products.update",

      "categories.create",
      "categories.read",
      "categories.update",

      "inventory.read",
      "inventory.update",

      "suppliers.read",

      "purchases.read",

      "sales.read",
    ],
  },

  {
    name: "Purchase Officer",
    permissions: [
      "suppliers.create",
      "suppliers.read",
      "suppliers.update",
      "suppliers.delete",

      "products.read",

      "categories.read",

      "purchases.create",
      "purchases.read",
      "purchases.update",
      "purchases.delete",

      "inventory.read",

      "payments.read",
    ],
  },

  {
    name: "Accountant",
    permissions: [
      "products.read",
      "categories.read",

      "customers.read",

      "suppliers.read",

      "sales.read",

      "purchases.read",

      "inventory.read",

      "payments.create",
      "payments.read",

      "reports.read",
    ],
  },
];

// ============================================================
// SEED DATABASE
// ============================================================

export const seedDemoData = async () => {
  // ==========================================================
  // CREATE / UPDATE ROLES
  // IMPORTANT:
  // This runs every time the seed function runs.
  // ==========================================================

  for (const item of roleSeed) {
    await Role.findOneAndUpdate(
      { name: item.name },
      {
        name: item.name,
        permissions: item.permissions,
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  // ==========================================================
  // CHECK DEMO DATA
  // ==========================================================

  const hasCategories = await Category.countDocuments();

  if (hasCategories > 0) {
    return;
  }

  // ==========================================================
  // GET ROLES
  // ==========================================================

  const adminRole = await Role.findOne({
    name: "Admin",
  });

  const managerRole = await Role.findOne({
    name: "Manager",
  });

  const salesmanRole = await Role.findOne({
    name: "Salesman",
  });

  const inventoryRole = await Role.findOne({
    name: "Inventory Manager",
  });

  const purchaseOfficerRole = await Role.findOne({
    name: "Purchase Officer",
  });

  const accountantRole = await Role.findOne({
    name: "Accountant",
  });

  // ==========================================================
  // CREATE DEMO USERS
  // ==========================================================

  const seededUsers = [];

  const userSeeds = [
    {
      name: "System Admin",
      email: "admin@erp.local",
      password: "admin123456",
      role: adminRole._id,
    },

    {
      name: "Operations Manager",
      email: "manager@erp.local",
      password: "manager123456",
      role: managerRole._id,
    },

    {
      name: "Cashier",
      email: "cashier@erp.local",
      password: "cashier123",
      role: salesmanRole._id,
    },

    {
      name: "Inventory Lead",
      email: "inventory@erp.local",
      password: "inventory123",
      role: inventoryRole._id,
    },

    {
      name: "Purchase Officer",
      email: "purchase@erp.local",
      password: "purchase123",
      role: purchaseOfficerRole._id,
    },

    {
      name: "Accounts",
      email: "accountant@erp.local",
      password: "accountant123",
      role: accountantRole._id,
    },
  ];

  for (const userSeed of userSeeds) {
    const existing = await User.findOne({
      email: userSeed.email.toLowerCase(),
    });

    if (!existing) {
      const hashed = await bcrypt.hash(userSeed.password, 12);

      seededUsers.push(
        await User.create({
          ...userSeed,
          email: userSeed.email.toLowerCase(),
          password: hashed,
          phone: "0000000000",
          isActive: true,
        }),
      );
    }
  }

  // ==========================================================
  // CREATE CATEGORIES
  // ==========================================================

  const categories = await Category.insertMany([
    {
      name: "Electronics",
      description: "Devices, accessories, and computing equipment",
    },
    {
      name: "Clothing",
      description: "Apparel and everyday wear",
    },
    {
      name: "Accessories",
      description: "Bags, wearables, and add-ons",
    },
    {
      name: "Food",
      description: "Packaged goods and consumables",
    },
  ]);

  const categoryMap = Object.fromEntries(
    categories.map((category) => [category.name, category._id]),
  );

  // ==========================================================
  // CREATE PRODUCTS
  // ==========================================================

  const createdProducts = [];

  for (const product of productCatalog) {
    const item = await Product.create({
      ...product,

      category: categoryMap[product.category],

      sku: product.sku,
      barcode: product.barcode,

      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,

      stock: product.stock,
      minimumStock: product.minimumStock,

      unit: product.unit,

      isActive: true,
    });

    createdProducts.push(item);
  }

  // ==========================================================
  // CREATE CUSTOMERS
  // ==========================================================

  const customerDocs = await Customer.insertMany(
    customerSeed.map((customer) => ({
      ...customer,
      isActive: true,
    })),
  );

  // ==========================================================
  // CREATE SUPPLIERS
  // ==========================================================

  const supplierDocs = await Supplier.insertMany(
    supplierSeed.map((supplier) => ({
      ...supplier,
      isActive: true,
    })),
  );

  // ==========================================================
  // CREATE DEMO PURCHASE
  // ==========================================================

  const supplierForPurchase = supplierDocs[0];

  const purchaseCreator =
    seededUsers[0] ||
    (await User.findOne({
      email: "admin@erp.local",
    }));

  const purchaseOne = await Purchase.create({
    supplier: supplierForPurchase._id,

    purchaseNumber: "PUR-000001",

    subtotal: 485,
    discount: 0,
    tax: 20,

    totalAmount: 505,

    paidAmount: 505,
    remainingAmount: 0,

    paymentStatus: "PAID",
    status: "COMPLETED",

    createdBy: purchaseCreator._id,
  });

  const purchaseItems = [
    {
      purchase: purchaseOne._id,
      product: createdProducts[0]._id,
      quantity: 2,
      costPrice: 780,
      discount: 0,
      tax: 20,
      total: 1580,
    },

    {
      purchase: purchaseOne._id,
      product: createdProducts[2]._id,
      quantity: 10,
      costPrice: 18,
      discount: 0,
      tax: 0,
      total: 180,
    },
  ];

  const purchaseItemDocs = await PurchaseItem.insertMany(purchaseItems);

  purchaseOne.items = purchaseItemDocs.map((item) => item._id);

  await purchaseOne.save();

  // ==========================================================
  // UPDATE INVENTORY FROM PURCHASE
  // ==========================================================

  for (const item of purchaseItems) {
    await inventoryService.increaseStock({
      productId: item.product,
      quantity: item.quantity,

      reason: "Demo purchase seed",

      referenceType: "PURCHASE",
      referenceId: purchaseOne._id.toString(),

      createdBy: purchaseCreator._id,

      type: "PURCHASE",
    });
  }

  // ==========================================================
  // CREATE DEMO SALE
  // ==========================================================

  const saleCreator =
    seededUsers[2] ||
    (await User.findOne({
      email: "cashier@erp.local",
    }));

  const saleCustomer = customerDocs[0];

  const saleOne = await Sale.create({
    customer: saleCustomer._id,

    invoiceNumber: "INV-000001",

    subtotal: 1560,
    discount: 30,
    tax: 70,

    totalAmount: 1600,

    paidAmount: 1600,
    remainingAmount: 0,

    paymentMethod: "CARD",
    paymentStatus: "PAID",
    status: "COMPLETED",

    createdBy: saleCreator._id,
  });

  const saleItemDocs = await SaleItem.insertMany([
    {
      sale: saleOne._id,
      product: createdProducts[0]._id,

      quantity: 1,

      sellingPrice: 1200,

      discount: 0,
      tax: 70,

      total: 1270,
    },

    {
      sale: saleOne._id,
      product: createdProducts[4]._id,

      quantity: 2,

      sellingPrice: 28,

      discount: 30,
      tax: 0,

      total: 26,
    },
  ]);

  saleOne.items = saleItemDocs.map((item) => item._id);

  await saleOne.save();

  // ==========================================================
  // UPDATE INVENTORY FROM SALE
  // ==========================================================

  for (const item of saleItemDocs) {
    await inventoryService.decreaseStock({
      productId: item.product,
      quantity: item.quantity,

      reason: "Demo sale seed",

      referenceType: "SALE",
      referenceId: saleOne._id.toString(),

      createdBy: saleCreator._id,

      type: "SALE",
    });
  }

  // ==========================================================
  // CREATE DEMO PAYMENT
  // ==========================================================

  await Payment.create({
    sale: saleOne._id,

    amount: 1600,

    method: "CARD",

    status: "PAID",

    referenceType: "SALE",

    referenceId: saleOne._id.toString(),

    createdBy: saleCreator._id,
  });
};

export default seedDemoData;
