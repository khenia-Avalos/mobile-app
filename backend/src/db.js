import mongoose from "mongoose";
import { DB_URL } from "./config.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(DB_URL)
        console.log("DB is connected")
    } catch (error) {
        console.error(error.message)
        process.exit(1)
    }
}