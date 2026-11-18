/**
 * BookMart Manual Seed Script
 *
 * Usage:
 *   node seed.js           -- upsert sample data (safe, never deletes existing data)
 *   node seed.js --force   -- delete all data and re-seed (requires ALLOW_DESTRUCTIVE_SEED=true in env)
 *
 * H-03 fix: This script no longer deletes data unless --force is explicitly passed
 * AND the ALLOW_DESTRUCTIVE_SEED environment variable is set to "true".
 * This prevents accidental wipes of production data.
 */

import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Book from './models/Book.js';
import Poster from './models/Poster.js';
import User from './models/User.js';
import Admin from './models/Admin.js';
import { sampleBooks } from './data/sampleBooks.js';
import { samplePosters } from './data/samplePosters.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const isForce = process.argv.includes('--force');

const seed = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    // ── Production safety guard ───────────────────────────────────────────────
    if (process.env.NODE_ENV === 'production' && isForce) {
      console.error(
        'ERROR: --force mode is disabled in production (NODE_ENV=production).\n' +
        'To run a forced re-seed against a staging/dev database, set NODE_ENV=development or staging.'
      );
      process.exit(1);
    }

    if (isForce && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
      console.error(
        'ERROR: --force requires ALLOW_DESTRUCTIVE_SEED=true in your .env file.\n' +
        'This is a safety check to prevent accidental production data loss.'
      );
      process.exit(1);
    }

    // ── Books ─────────────────────────────────────────────────────────────────
    if (isForce) {
      console.log('--force: Clearing all books...');
      await Book.deleteMany({});
      const createdBooks = await Book.insertMany(sampleBooks);
      console.log(`✅ Force-seeded ${createdBooks.length} eBooks.`);
    } else {
      // Safe upsert: only insert books that don't already exist (matched by title + author)
      let inserted = 0;
      for (const book of sampleBooks) {
        const exists = await Book.findOne({ title: book.title, author: book.author });
        if (!exists) {
          await Book.create(book);
          inserted++;
        }
      }
      console.log(`✅ Upserted books: ${inserted} new books inserted (${sampleBooks.length - inserted} already existed).`);
    }

    // ── Posters ───────────────────────────────────────────────────────────────
    if (isForce) {
      console.log('--force: Clearing all posters...');
      await Poster.deleteMany({});
      const createdPosters = await Poster.insertMany(samplePosters);
      console.log(`✅ Force-seeded ${createdPosters.length} posters.`);
    } else {
      const posterCount = await Poster.countDocuments();
      if (posterCount === 0) {
        await Poster.insertMany(samplePosters);
        console.log(`✅ Seeded ${samplePosters.length} promotional posters.`);
      } else {
        console.log(`ℹ️  Posters already exist (${posterCount}), skipping poster seed.`);
      }
    }

    // ── Admin Account ─────────────────────────────────────────────────────────
    // Never overwrite existing admin passwords — only create if none exists.
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️  ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD not set; skipping admin seed.');
    } else {
      const existingAdmin = await Admin.findOne({ email: adminEmail });
      if (!existingAdmin) {
        await Admin.create({
          name: 'Super Admin',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isActive: true,
        });
        console.log(`✅ Created admin account (${adminEmail}). Remove ADMIN_DEFAULT_PASSWORD from env after first login.`);
      } else {
        console.log(`ℹ️  Admin account already exists (${adminEmail}), password NOT changed.`);
      }
    }

    // ── Demo Customer (dev/test only) ─────────────────────────────────────────
    if (process.env.NODE_ENV !== 'production') {
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
    }

    console.log('\n🎉 Seed completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
