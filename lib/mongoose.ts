
import mongoose from "mongoose";
let isConnected = false // variable to check the connection of mongoose

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);
    if (!process.env.MONGODB_URL) {
        return console.log(' MONGODB_URL not found');

    }
    if (isConnected) {
        return console.log(' already connected to MongoDB ..................');

    }

    try {
        await mongoose.connect(process.env.MONGODB_URL)
        isConnected = true
        console.log('connected to mongoDB $$$$$');  
    } catch (error) {
        console.log(error);

    }

}

/**
 * Check if MongoDB connection is healthy
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export const checkMongoDBConnection = async (): Promise<boolean> => {
  try {
    const state = mongoose.connection.readyState;
    /*
      Mongoose readyState values:
      0 = disconnected
      1 = connected
      2 = connecting
      3 = disconnecting
    */
    return state === 1;
  } catch (error) {
    console.error("Error checking MongoDB connection:", error);
    return false;
  }
};
