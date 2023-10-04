import mongoose from "mongoose";
require("dotenv").config();

const mongoUri = process.env.MONGO_URI as string;

const connectDb = async () => {
  try {
    await mongoose.connect(mongoUri).then((data: any) => {
      console.log(`Database connected with ${data.connection.host}`);
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDb, 5000);
  }
};

export default connectDb;
