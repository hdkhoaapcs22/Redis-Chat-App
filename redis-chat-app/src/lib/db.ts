import { Redis } from "@upstash/redis";
import mongoose from "mongoose";

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

let isConnected = false;
export const connectDb = async () => {
    if (isConnected) {
        console.log("is Connected");
        return;
    }

    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URL}/chatapp`);

        isConnected = db.connections[0].readyState === 1;

        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw new Error("MongoDB connection failed");
    }
};

export default connectDb;
