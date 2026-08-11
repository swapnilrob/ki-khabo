import mongoose from "mongoose";
import dns from "dns";

// Windows: Node's SRV resolver can pick up a stale/virtual adapter's DNS.
// Force public resolvers so mongodb+srv:// lookups work.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;