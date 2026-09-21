import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@bookmart.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
    const adminName = 'System Administrator';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log(`[Admin Seed] Existing user '${adminEmail}' upgraded to 'admin' role.`);
      } else {
        console.log(`[Admin Seed] Admin '${adminEmail}' already exists with 'admin' role.`);
      }
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`[Admin Seed] Default admin created successfully:`);
      console.log(`             Email:    ${adminEmail}`);
      console.log(`             Password: ${adminPassword}`);
    }

    const totalAdmins = await User.countDocuments({ role: 'admin' });
    console.log(`[Admin Seed] Total administrators in database: ${totalAdmins}`);
    process.exit(0);
  } catch (error) {
    console.error('[Admin Seed] Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
