import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Book from './models/Book.js';
import Poster from './models/Poster.js';
import User from './models/User.js';
import { sampleBooks } from './data/sampleBooks.js';
import { samplePosters } from './data/samplePosters.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    // 1. Seed Books
    console.log('Clearing old books...');
    await Book.deleteMany({});
    const createdBooks = await Book.insertMany(sampleBooks);
    console.log(`✅ Successfully seeded ${createdBooks.length} eBooks across 10 categories.`);

    // 2. Seed Promotional Posters & Banners
    console.log('Clearing old posters...');
    await Poster.deleteMany({});
    const createdPosters = await Poster.insertMany(samplePosters);
    console.log(`✅ Successfully seeded ${createdPosters.length} promotional posters.`);

    // 3. Seed Default Admin User
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@bookmart.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`✅ Created default admin account (${adminEmail})`);
    } else {
      console.log(`ℹ️ Admin account already exists (${adminEmail})`);
    }

    // 4. Seed Demo Customer Account
    const customerEmail = 'customer@bookmart.com';
    const existingCustomer = await User.findOne({ email: customerEmail });
    if (!existingCustomer) {
      await User.create({
        name: 'Demo Reader',
        email: customerEmail,
        password: 'Password@123',
        role: 'user',
      });
      console.log(`✅ Created demo customer account (${customerEmail})`);
    }

    console.log('\n🎉 ALL DATA (BOOKS, POSTERS, USERS) SEEDED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
