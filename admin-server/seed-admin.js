import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    const email = 'admin@bookmart.com';
    const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
    const name = 'System Administrator';

    let admin = await User.findOne({ email });

    if (admin) {
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log(`[Admin Seed] Existing user '${email}' upgraded to 'admin' role.`);
      } else {
        console.log(`[Admin Seed] Admin '${email}' already exists with 'admin' role.`);
      }
    } else {
      admin = await User.create({
        name,
        email,
        password,
        role: 'admin',
      });
      console.log(`[Admin Seed] Default admin created successfully:`);
      console.log(`             Email:    ${email}`);
      console.log(`             Password: ${password}`);
    }

    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`[Admin Seed] Total administrators in database: ${adminCount}`);
    process.exit(0);
  } catch (error) {
    console.error('[Admin Seed] Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seed();
