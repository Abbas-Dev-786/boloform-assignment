import mongoose from "mongoose";

export default async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string, {
      autoIndex: true,
    });

    console.log("DB connected ✅");
  } catch (error) {
    console.log("DB not connected ❌", error);
    process.exit(0);
  }
}
