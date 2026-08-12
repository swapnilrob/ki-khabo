import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`ℹ️  Admin already exists: ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.create({
    name: "Ki Khabo Admin",
    email,
    phone: "01700000000",
    password,
    role: "admin",
  });

  console.log(`✅ Admin created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
};

createAdmin();