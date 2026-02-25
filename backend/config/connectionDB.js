import mongoose from "mongoose";
 
export const connectDB = async () => {
  try {
    // await mongoose.connect(`${process.env.MONGO_URL}` || "mongodb+srv://benevolentworld751_db_user:222YW2OSNsqM13BI@cluster0.a4y791d.mongodb.net/benevolent_world");
        await mongoose.connect(`${process.env.MONGO_URL}`);
    console.log("MongoDB Connected");
  } catch (error) {
    console.log("error to connect DB", error);
    process.exit(0);
  }
};
