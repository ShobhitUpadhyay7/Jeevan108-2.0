import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Credential } from './models/Credential.model.js';

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('[Seed] Connected to Auth DB');

    const staffEmail = process.env.STAFF_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;
    const password = process.env.STAFF_PASSWORD;
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Seed Staff User
    if (!(await Credential.findOne({ email: staffEmail }))) {
      await Credential.create({
        email: staffEmail,
        phone: '+919000000001',
        passwordHash,
        role: 'staff',
        status: 'active'
      });
      console.log(`✅ [Seed] Created Staff: ${staffEmail} / ${password}`);
    } else {
      console.log(`ℹ️ [Seed] Staff already exists.`);
    }

    // 2. Seed Admin User (You'll need this later for KB management!)
    if (!(await Credential.findOne({ email: adminEmail }))) {
      await Credential.create({
        email: adminEmail,
        phone: '+919000000002',
        passwordHash,
        role: 'admin',
        status: 'active'
      });
      console.log(`✅ [Seed] Created Admin: ${adminEmail} / ${password}`);
    } else {
      console.log(`ℹ️ [Seed] Admin already exists.`);
    }

    console.log('[Seed] Done!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error:', err);
    process.exit(1);
  }
};

runSeed();