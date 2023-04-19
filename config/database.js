import mongoose from "mongoose";

export const connectDB = async () => {
  try {
     const { connection } = await mongoose.connect(process.env.MONGO_URI, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
     });

     console.log(`mongoDB connected :${connection.host}`);
  } catch (error) {
     console.log(error);
     process.exit(1);
  }
};
