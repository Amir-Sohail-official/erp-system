import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Role from './src/models/Role.js';
import User from './src/models/User.js';
import Category from './src/models/Category.js';
import Supplier from './src/models/Supplier.js';
import Customer from './src/models/Customer.js';
import Product from './src/models/Product.js';
import Purchase from './src/models/Purchase.js';
import PurchaseItem from './src/models/PurchaseItem.js';
import Sale from './src/models/Sale.js';
import SaleItem from './src/models/SaleItem.js';
import Payment from './src/models/Payment.js';
import InventoryTransaction from './src/models/InventoryTransaction.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erp_db';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const randomDate = (daysBack = 30) => {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
};

const genInvoice = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${randInt(100, 999)}`;

const rolesData = [
  {
    name: 'Admin',
    description: 'Full system access',
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage',
      'categories.create', 'categories.read', 'categories.update', 'categories.delete',
      'products.create', 'products.read', 'products.update', 'products.delete',
      'customers.create', 'customers.read', 'customers.update', 'customers.delete',
      'suppliers.create', 'suppliers.read', 'suppliers.update', 'suppliers.delete',
      'sales.create', 'sales.read', 'sales.update', 'sales.delete',
      'purchases.create', 'purchases.read', 'purchases.update', 'purchases.delete',
      'inventory.read', 'inventory.update',
      'payments.create', 'payments.read',
      'reports.read',
    ],
  },
  {
    name: 'Manager',
    description: 'Manage operations',
    permissions: [
      'categories.create', 'categories.read', 'categories.update', 'categories.delete',
      'products.create', 'products.read', 'products.update', 'products.delete',
      'customers.create', 'customers.read', 'customers.update', 'customers.delete',
      'suppliers.create', 'suppliers.read', 'suppliers.update', 'suppliers.delete',
      'sales.create', 'sales.read', 'sales.update', 'sales.delete',
      'purchases.create', 'purchases.read', 'purchases.update', 'purchases.delete',
      'inventory.read', 'inventory.update',
      'payments.read',
      'reports.read',
    ],
  },
  {
    name: 'Salesman',
    description: 'Handle sales',
    permissions: [
      'products.read', 'categories.read',
      'customers.create', 'customers.read', 'customers.update',
      'sales.create', 'sales.read', 'sales.update',
      'payments.create', 'payments.read',
    ],
  },
  {
    name: 'Inventory Manager',
    description: 'Manage stock',
    permissions: [
      'products.create', 'products.read', 'products.update',
      'categories.create', 'categories.read', 'categories.update',
      'inventory.read', 'inventory.update',
      'suppliers.read',
      'purchases.read',
      'sales.read',
    ],
  },
  {
    name: 'Purchase Officer',
    description: 'Handle purchases',
    permissions: [
      'suppliers.create', 'suppliers.read', 'suppliers.update', 'suppliers.delete',
      'products.read',
      'categories.read',
      'purchases.create', 'purchases.read', 'purchases.update', 'purchases.delete',
      'inventory.read',
      'payments.read',
    ],
  },
  {
    name: 'Accountant',
    description: 'Financial records',
    permissions: [
      'products.read', 'categories.read',
      'customers.read',
      'suppliers.read',
      'sales.read',
      'purchases.read',
      'inventory.read',
      'payments.create', 'payments.read',
      'reports.read',
    ],
  },
];

const categoriesData = [
  { name: 'Electronics', description: 'Electronic devices and accessories', isActive: true },
  { name: 'Clothing & Apparel', description: 'Men, women, and children clothing', isActive: true },
  { name: 'Food & Beverages', description: 'Groceries and consumables', isActive: true },
  { name: 'Home & Garden', description: 'Furniture and household items', isActive: true },
  { name: 'Health & Beauty', description: 'Personal care and cosmetics', isActive: true },
  { name: 'Sports & Outdoors', description: 'Athletic and outdoor gear', isActive: true },
  { name: 'Books & Media', description: 'Books, music, and digital media', isActive: true },
  { name: 'Automotive', description: 'Car parts and accessories', isActive: true },
  { name: 'Office Supplies', description: 'Stationery and office equipment', isActive: true },
  { name: 'Toys & Games', description: 'Children toys and games', isActive: false },
];

const suppliersData = [
  { name: 'TechWorld Distributors', email: 'orders@techworld.com', phone: '+1-555-0101', address: '123 Silicon Ave', city: 'San Jose', openingBalance: 0, isActive: true },
  { name: 'Fashion Hub Ltd', email: 'supply@fashionhub.com', phone: '+1-555-0102', address: '456 Style Blvd', city: 'New York', openingBalance: 500, isActive: true },
  { name: 'Fresh Foods Co', email: 'wholesale@freshfoods.com', phone: '+1-555-0103', address: '789 Market St', city: 'Chicago', openingBalance: 0, isActive: true },
  { name: 'HomeStyle Imports', email: 'contact@homestyle.com', phone: '+1-555-0104', address: '321 Decor Rd', city: 'Los Angeles', openingBalance: 1200, isActive: true },
  { name: 'BeautyBox Inc', email: 'sales@beautybox.com', phone: '+1-555-0105', address: '654 Glam Ave', city: 'Miami', openingBalance: 0, isActive: true },
  { name: 'SportGear Pro', email: 'bulk@sportgear.com', phone: '+1-555-0106', address: '987 Fitness Ln', city: 'Denver', openingBalance: 300, isActive: true },
  { name: 'BookWorm Publishers', email: 'trade@bookworm.com', phone: '+1-555-0107', address: '147 Read St', city: 'Boston', openingBalance: 0, isActive: true },
  { name: 'AutoParts Direct', email: 'orders@autoparts.com', phone: '+1-555-0108', address: '258 Motor Way', city: 'Detroit', openingBalance: 800, isActive: true },
  { name: 'OfficeMax Supply', email: 'corporate@officemax.com', phone: '+1-555-0109', address: '369 Paper Rd', city: 'Seattle', openingBalance: 0, isActive: true },
  { name: 'ToyLand Wholesale', email: 'bulk@toyland.com', phone: '+1-555-0110', address: '741 Play Ave', city: 'Orlando', openingBalance: 0, isActive: false },
];

const customersData = [
  { name: 'Acme Corporation', email: 'purchasing@acme.com', phone: '+1-555-1001', address: '100 Business Park', city: 'New York', openingBalance: 0, isActive: true },
  { name: 'Global Traders LLC', email: 'orders@globaltraders.com', phone: '+1-555-1002', address: '200 Trade Center', city: 'Los Angeles', openingBalance: 1500, isActive: true },
  { name: 'Sunrise Retail', email: 'buy@sunrise.com', phone: '+1-555-1003', address: '300 Market St', city: 'Chicago', openingBalance: 0, isActive: true },
  { name: 'Metro Mart', email: 'contact@metromart.com', phone: '+1-555-1004', address: '400 Main Ave', city: 'Houston', openingBalance: 250, isActive: true },
  { name: 'Peak Enterprises', email: 'sales@peak.com', phone: '+1-555-1005', address: '500 Summit Rd', city: 'Phoenix', openingBalance: 0, isActive: true },
  { name: 'Blue Ocean Co', email: 'info@blueocean.com', phone: '+1-555-1006', address: '600 Harbor Dr', city: 'San Diego', openingBalance: 700, isActive: true },
  { name: 'Redwood Stores', email: 'orders@redwood.com', phone: '+1-555-1007', address: '700 Forest Ln', city: 'Portland', openingBalance: 0, isActive: true },
  { name: 'Silverline Inc', email: 'purchasing@silverline.com', phone: '+1-555-1008', address: '800 Alloy St', city: 'Austin', openingBalance: 400, isActive: true },
  { name: 'Golden Gate Retail', email: 'buy@goldengate.com', phone: '+1-555-1009', address: '900 Bridge Ave', city: 'San Francisco', openingBalance: 0, isActive: true },
  { name: 'NorthStar Wholesale', email: 'bulk@northstar.com', phone: '+1-555-1010', address: '1000 Polar Rd', city: 'Minneapolis', openingBalance: 0, isActive: false },
];

const productsData = [
  { name: 'Wireless Headphones', sku: 'ELEC-WH-001', barcode: '8901234567890', description: 'Bluetooth 5.0 over-ear headphones', costPrice: 45, sellingPrice: 89.99, stock: 120, minimumStock: 20, unit: 'pcs', isActive: true },
  { name: 'Smartphone X12', sku: 'ELEC-SP-002', barcode: '8901234567891', description: 'Latest flagship smartphone', costPrice: 450, sellingPrice: 799, stock: 35, minimumStock: 10, unit: 'pcs', isActive: true },
  { name: 'Laptop Pro 15"', sku: 'ELEC-LP-003', barcode: '8901234567892', description: 'High-performance laptop', costPrice: 900, sellingPrice: 1499, stock: 18, minimumStock: 5, unit: 'pcs', isActive: true },
  { name: 'Cotton T-Shirt', sku: 'CLTH-TS-004', barcode: '8901234567893', description: 'Premium cotton t-shirt', costPrice: 5, sellingPrice: 19.99, stock: 500, minimumStock: 100, unit: 'pcs', isActive: true },
  { name: 'Denim Jeans', sku: 'CLTH-JN-005', barcode: '8901234567894', description: 'Classic fit denim jeans', costPrice: 15, sellingPrice: 49.99, stock: 250, minimumStock: 50, unit: 'pcs', isActive: true },
  { name: 'Organic Coffee Beans', sku: 'FOOD-CF-006', barcode: '8901234567895', description: '1kg premium coffee beans', costPrice: 8, sellingPrice: 18, stock: 300, minimumStock: 50, unit: 'kg', isActive: true },
  { name: 'Office Chair', sku: 'HOME-CH-007', barcode: '8901234567896', description: 'Ergonomic office chair', costPrice: 120, sellingPrice: 249.99, stock: 40, minimumStock: 10, unit: 'pcs', isActive: true },
  { name: 'Face Cream', sku: 'HLTH-FC-008', barcode: '8901234567897', description: 'Moisturizing face cream 50ml', costPrice: 6, sellingPrice: 24.99, stock: 200, minimumStock: 30, unit: 'pcs', isActive: true },
  { name: 'Yoga Mat', sku: 'SPRT-YM-009', barcode: '8901234567898', description: 'Non-slip yoga mat', costPrice: 10, sellingPrice: 29.99, stock: 150, minimumStock: 25, unit: 'pcs', isActive: true },
  { name: 'Novel Bestseller', sku: 'BOOK-NV-010', barcode: '8901234567899', description: 'Latest bestselling novel', costPrice: 7, sellingPrice: 15.99, stock: 80, minimumStock: 15, unit: 'pcs', isActive: true },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Purchase.deleteMany({}),
      PurchaseItem.deleteMany({}),
      Sale.deleteMany({}),
      SaleItem.deleteMany({}),
      Payment.deleteMany({}),
      InventoryTransaction.deleteMany({}),
    ]);
    console.log('Cleared all collections');

    const roles = await Role.insertMany(rolesData);
    console.log(`Inserted ${roles.length} roles`);

    const adminRole = roles.find((r) => r.name === 'Admin');
    const salesmanRole = roles.find((r) => r.name === 'Salesman');
    const purchaseOfficerRole = roles.find((r) => r.name === 'Purchase Officer');
    const accountantRole = roles.find((r) => r.name === 'Accountant');
    const managerRole = roles.find((r) => r.name === 'Manager');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = await User.insertMany([
      { name: 'Admin User', email: 'admin@erp.com', password: hashedPassword, phone: '+1-555-0001', role: adminRole._id, isActive: true },
      { name: 'John Salesman', email: 'john@erp.com', password: hashedPassword, phone: '+1-555-0002', role: salesmanRole._id, isActive: true },
      { name: 'Sarah Purchaser', email: 'sarah@erp.com', password: hashedPassword, phone: '+1-555-0003', role: purchaseOfficerRole._id, isActive: true },
      { name: 'Mike Accountant', email: 'mike@erp.com', password: hashedPassword, phone: '+1-555-0004', role: accountantRole._id, isActive: true },
      { name: 'Emma Manager', email: 'emma@erp.com', password: hashedPassword, phone: '+1-555-0005', role: managerRole._id, isActive: true },
    ]);
    console.log(`Inserted ${users.length} users`);

    const categories = await Category.insertMany(categoriesData);
    console.log(`Inserted ${categories.length} categories`);

    const categoryMap = {
      'ELEC': categories.find((c) => c.name === 'Electronics')._id,
      'CLTH': categories.find((c) => c.name === 'Clothing & Apparel')._id,
      'FOOD': categories.find((c) => c.name === 'Food & Beverages')._id,
      'HOME': categories.find((c) => c.name === 'Home & Garden')._id,
      'HLTH': categories.find((c) => c.name === 'Health & Beauty')._id,
      'SPRT': categories.find((c) => c.name === 'Sports & Outdoors')._id,
      'BOOK': categories.find((c) => c.name === 'Books & Media')._id,
    };
    productsData.forEach((p) => {
      const prefix = p.sku.split('-')[0];
      p.category = categoryMap[prefix] || categories[0]._id;
    });

    const supplierDocs = await Supplier.insertMany(suppliersData);
    console.log(`Inserted ${supplierDocs.length} suppliers`);

    const customerDocs = await Customer.insertMany(customersData);
    console.log(`Inserted ${customerDocs.length} customers`);

    const productDocs = await Product.insertMany(productsData);
    console.log(`Inserted ${productDocs.length} products`);

    const TAX_RATE = 0.08;
    const purchaseRecords = [];
    const purchaseItemRecords = [];

    const PURCHASE_COUNT = 12;
    for (let i = 0; i < PURCHASE_COUNT; i++) {
      const supplier = pick(supplierDocs);
      const creator = users[2] || users[0];
      const createdAt = randomDate(30);
      const purchaseNumber = genInvoice('PO');

      const itemCount = randInt(1, 4);
      const pickedProducts = [];
      const selectedIndices = new Set();
      while (pickedProducts.length < itemCount) {
        const idx = randInt(0, productDocs.length - 1);
        if (!selectedIndices.has(idx)) {
          selectedIndices.add(idx);
          pickedProducts.push(productDocs[idx]);
        }
      }

      const itemsForPurchase = [];
      let subtotal = 0;
      for (const product of pickedProducts) {
        const qty = randInt(5, 30);
        const cost = product.costPrice;
        const lineTotal = parseFloat((qty * cost).toFixed(2));
        subtotal += lineTotal;
        itemsForPurchase.push({
          product: product._id,
          quantity: qty,
          costPrice: cost,
          discount: 0,
          tax: 0,
          total: lineTotal,
        });
      }

      const discount = parseFloat((subtotal * (Math.random() > 0.7 ? randFloat(0.02, 0.1) : 0)).toFixed(2));
      const afterDiscount = parseFloat((subtotal - discount).toFixed(2));
      const tax = parseFloat((afterDiscount * TAX_RATE).toFixed(2));
      const totalAmount = parseFloat((afterDiscount + tax).toFixed(2));

      const paymentRoll = Math.random();
      let paidAmount;
      let paymentStatus;
      if (paymentRoll < 0.55) {
        paidAmount = totalAmount;
        paymentStatus = 'PAID';
      } else if (paymentRoll < 0.85) {
        paidAmount = parseFloat((totalAmount * randFloat(0.3, 0.8)).toFixed(2));
        paymentStatus = 'PARTIAL';
      } else {
        paidAmount = 0;
        paymentStatus = 'UNPAID';
      }
      const remainingAmount = parseFloat((totalAmount - paidAmount).toFixed(2));

      const purchase = await Purchase.create({
        supplier: supplier._id,
        purchaseNumber,
        items: [],
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount,
        tax,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus,
        status: 'COMPLETED',
        createdBy: creator._id,
        createdAt,
        updatedAt: createdAt,
      });

      const pItemsWithRef = itemsForPurchase.map((it) => ({
        ...it,
        purchase: purchase._id,
        createdAt,
        updatedAt: createdAt,
      }));
      const createdPItems = await PurchaseItem.insertMany(pItemsWithRef);
      purchase.items = createdPItems.map((pi) => pi._id);
      await purchase.save();

      purchaseRecords.push(purchase);
      purchaseItemRecords.push(...createdPItems);
    }
    console.log(`Inserted ${purchaseRecords.length} purchases with ${purchaseItemRecords.length} items`);

    const saleRecords = [];
    const saleItemRecords = [];
    const SALE_COUNT = 20;

    for (let i = 0; i < SALE_COUNT; i++) {
      const customer = pick(customerDocs);
      const creator = users[1] || users[0];
      const recencyBias = Math.pow(Math.random(), 2);
      const daysBack = Math.floor(recencyBias * 30);
      const createdAt = randomDate(Math.max(daysBack, 1));
      const invoiceNumber = genInvoice('INV');

      const itemCount = randInt(1, 5);
      const pickedProducts = [];
      const selectedIndices = new Set();
      while (pickedProducts.length < itemCount) {
        const idx = randInt(0, productDocs.length - 1);
        if (!selectedIndices.has(idx)) {
          selectedIndices.add(idx);
          pickedProducts.push(productDocs[idx]);
        }
      }

      const itemsForSale = [];
      let subtotal = 0;
      for (const product of pickedProducts) {
        const qty = randInt(1, 10);
        const price = product.sellingPrice;
        const lineDiscount = Math.random() > 0.65 ? randFloat(0, 0.15) : 0;
        const lineBase = parseFloat((qty * price).toFixed(2));
        const lineAfterDiscount = parseFloat((lineBase * (1 - lineDiscount)).toFixed(2));
        const lineTax = parseFloat((lineAfterDiscount * TAX_RATE).toFixed(2));
        const lineTotal = parseFloat((lineAfterDiscount + lineTax).toFixed(2));
        subtotal += lineBase;
        itemsForSale.push({
          product: product._id,
          quantity: qty,
          sellingPrice: price,
          discount: parseFloat((lineBase * lineDiscount).toFixed(2)),
          tax: lineTax,
          total: lineTotal,
        });
      }

      const totalLineDiscount = itemsForSale.reduce((s, it) => s + it.discount, 0);
      const afterDiscount = parseFloat((subtotal - totalLineDiscount).toFixed(2));
      const totalLineTax = itemsForSale.reduce((s, it) => s + it.tax, 0);
      const totalAmount = parseFloat((afterDiscount + totalLineTax).toFixed(2));

      const paymentMethods = ['CASH', 'CARD', 'BANK_TRANSFER'];
      const paymentMethod = pick(paymentMethods);

      const paymentRoll = Math.random();
      let paidAmount;
      let paymentStatus;
      if (paymentRoll < 0.65) {
        paidAmount = totalAmount;
        paymentStatus = 'PAID';
      } else if (paymentRoll < 0.9) {
        paidAmount = parseFloat((totalAmount * randFloat(0.25, 0.85)).toFixed(2));
        paymentStatus = 'PARTIAL';
      } else {
        paidAmount = 0;
        paymentStatus = 'UNPAID';
      }
      const remainingAmount = parseFloat((totalAmount - paidAmount).toFixed(2));

      const sale = await Sale.create({
        customer: customer._id,
        invoiceNumber,
        items: [],
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: totalLineDiscount,
        tax: totalLineTax,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentMethod,
        paymentStatus,
        status: 'COMPLETED',
        createdBy: creator._id,
        createdAt,
        updatedAt: createdAt,
      });

      const sItemsWithRef = itemsForSale.map((it) => ({
        ...it,
        sale: sale._id,
        createdAt,
        updatedAt: createdAt,
      }));
      const createdSItems = await SaleItem.insertMany(sItemsWithRef);
      sale.items = createdSItems.map((si) => si._id);
      await sale.save();

      saleRecords.push(sale);
      saleItemRecords.push(...createdSItems);
    }
    console.log(`Inserted ${saleRecords.length} sales with ${saleItemRecords.length} items`);

    const payments = [];
    for (const sale of saleRecords) {
      if (sale.paidAmount > 0) {
        payments.push({
          referenceType: 'SALE',
          referenceId: sale._id.toString(),
          customer: sale.customer,
          supplier: null,
          amount: sale.paidAmount,
          paymentMethod: sale.paymentMethod,
          paymentType: 'SALE',
          transactionReference: `TXN-${sale.invoiceNumber}`,
          notes: `Payment for invoice ${sale.invoiceNumber}`,
          createdBy: users[3]._id,
          createdAt: sale.createdAt,
          updatedAt: sale.createdAt,
        });
      }
    }
    for (const purchase of purchaseRecords) {
      if (purchase.paidAmount > 0) {
        payments.push({
          referenceType: 'PURCHASE',
          referenceId: purchase._id.toString(),
          customer: null,
          supplier: purchase.supplier,
          amount: purchase.paidAmount,
          paymentMethod: 'BANK_TRANSFER',
          paymentType: 'PURCHASE',
          transactionReference: `TXN-${purchase.purchaseNumber}`,
          notes: `Payment for PO ${purchase.purchaseNumber}`,
          createdBy: users[3]._id,
          createdAt: purchase.createdAt,
          updatedAt: purchase.createdAt,
        });
      }
    }
    await Payment.insertMany(payments);
    console.log(`Inserted ${payments.length} payments`);

    const inventoryTransactions = [];
    for (const product of productDocs) {
      inventoryTransactions.push({
        product: product._id,
        type: 'PURCHASE',
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        referenceType: 'INITIAL',
        referenceId: 'SEED',
        reason: 'Initial stock seeding',
        createdBy: users[0]._id,
        createdAt: randomDate(30),
      });
    }

    for (const item of purchaseItemRecords) {
      const product = productDocs.find((p) => p._id.toString() === item.product.toString());
      if (product) {
        inventoryTransactions.push({
          product: product._id,
          type: 'PURCHASE',
          quantity: item.quantity,
          previousStock: Math.max(0, product.stock - item.quantity),
          newStock: product.stock,
          referenceType: 'PURCHASE',
          referenceId: item.purchase.toString(),
          reason: 'Purchase order received',
          createdBy: users[2]._id,
          createdAt: randomDate(30),
        });
      }
    }

    for (const item of saleItemRecords) {
      const product = productDocs.find((p) => p._id.toString() === item.product.toString());
      if (product) {
        const stockAfter = Math.max(0, product.stock - item.quantity);
        inventoryTransactions.push({
          product: product._id,
          type: 'SALE',
          quantity: item.quantity,
          previousStock: product.stock,
          newStock: stockAfter,
          referenceType: 'SALE',
          referenceId: item.sale.toString(),
          reason: 'Customer sale',
          createdBy: users[1]._id,
          createdAt: randomDate(30),
        });
      }
    }

    await InventoryTransaction.insertMany(inventoryTransactions);
    console.log(`Inserted ${inventoryTransactions.length} inventory transactions`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('\nSeed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('   Admin:      admin@erp.com / password123');
    console.log('   Salesman:   john@erp.com / password123');
    console.log('   Purchaser:  sarah@erp.com / password123');
    console.log('   Accountant: mike@erp.com / password123');
    console.log('   Manager:    emma@erp.com / password123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

seed();
