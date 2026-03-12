import mongoose from "mongoose";
import { env } from "./env";

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  isConnected = true;
  console.log("[MongoDB] Connected to:", env.MONGODB_DB_NAME);

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err);
    isConnected = false;
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected");
    isConnected = false;
  });
}

export function getMongoose() {
  return mongoose;
}
