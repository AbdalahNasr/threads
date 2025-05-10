"use server";

import User from "./models/user.model";
import { connectToDB } from "./mongoose";

/**
 * Debug helper to verify user existence in database
 * Used only for development troubleshooting
 */
export async function debugUserExists(userId: string) {
  try {
    await connectToDB();
    
    console.log("Checking for user with ID:", userId);
    console.log("ID type:", typeof userId);
    
    // Try to find the user
    const userObjectId = await User.findOne({ id: userId });
    
    if (userObjectId) {
      console.log("User found:", userObjectId.name);
      return { found: true, name: userObjectId.name };
    } else {
      console.log("User not found with ID:", userId);
      
      // Check if any users exist
      const totalUsers = await User.countDocuments();
      console.log("Total users in database:", totalUsers);
      
      // Get a sample user to check ID format
      if (totalUsers > 0) {
        const sampleUser = await User.findOne();
        console.log("Sample user ID format:", sampleUser?.id);
        console.log("Sample user ID type:", typeof sampleUser?.id);
      }
      
      return { found: false, totalUsers };
    }
  } catch (error: any) {
    console.error("Debug error:", error);
    return { error: error.message };
  }
}