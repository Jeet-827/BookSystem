import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_DEFAULT_EMAIL || 'admin@bookmart.com';
    const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2025Secure';
    const name = 'System Administrator';

    let admin = await Admin.findOne({ email });

    if (admin) {
      admin.role = 'admin';
      admin.password = password; // Triggers pre('save') hook to rehash password
      admin.isActive = true;
      await admin.save();
      console.log(`[Admin Seed] Existing admin account '${email}' in Admin schema synchronized and password updated successfully.`);
      console.log(`             Email:    ${email}`);
      console.log(`             Password: ${password}`);
    } else {
      admin = await Admin.create({
        name,
        email,
        password,
        role: 'admin',
        isActive: true,
      });
      console.log(`[Admin Seed] Default admin created successfully in Admin schema:`);
      console.log(`             Email:    ${email}`);
      console.log(`             Password: ${password}`);
    }

    const adminCount = await Admin.countDocuments();
    console.log(`[Admin Seed] Total administrators in Admin schema: ${adminCount}`);
    process.exit(0);
  } catch (error) {
    console.error('[Admin Seed] Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seed();
