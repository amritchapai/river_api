import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Database Connected Successfully");

    await createIndexes();
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    await db.collection("rivers").createIndex({ geometry: "2dsphere" });
    await db.collection("rivers").createIndex({ osmId: 1 });
    await db.collection("rivers").createIndex({ name: "text" });
  } catch (error) {
    console.error("error during index creation", error.message);
  }
};

export default connectDB;
