import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Book from './models/Book.js';
import { sampleBooks } from './controllers/bookController.js';

dotenv.config();

const runSeed = async () => {
  try {
    await connectDB();
    await Book.deleteMany({});
    await Book.insertMany(sampleBooks);
    console.log(`Seeded ${sampleBooks.length} books.`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

runSeed();
