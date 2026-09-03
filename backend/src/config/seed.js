import bcrypt from 'bcryptjs';

import Role from '../models/Role.js';
import User from '../models/User.js';
import { ROLE_DEFINITIONS } from '../utils/permissions.js';
import { seedDemoData } from './demoData.js';

export const seedRoles = async () => {
  const roleEntries = Object.entries(ROLE_DEFINITIONS);

  for (const [name, permissions] of roleEntries) {
    const description = `${name} role for ERP access control`;

    await Role.findOneAndUpdate(
      { name },
      { name, description, permissions },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
};

export const seedAdminUser = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const adminRole = await Role.findOne({ name: 'Admin' });

  if (!adminRole) {
    return;
  }

  const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });

  if (existingUser) {
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await User.create({
    name: process.env.SEED_ADMIN_NAME || 'System Admin',
    email: adminEmail.toLowerCase(),
    password: hashedPassword,
    phone: '0000000000',
    role: adminRole._id,
    isActive: true,
  });
};

export const seedDatabase = async () => {
  await seedRoles();
  await seedAdminUser();
  await seedDemoData();
};
