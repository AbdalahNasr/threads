"use server";

import { connectToDB } from "../mongoose";
import Community from "../models/community.model";
import User from "../models/user.model";
import { CommunityCreationParams, CommunityOperationResult } from "@/lib/types/community.types";

/**
 * Diagnostic function to create a community with verbose logging
 * This helps identify exactly where the community creation process fails
 */
export async function diagnosticCreateCommunity(params: CommunityCreationParams): Promise<CommunityOperationResult> {
  const logs: string[] = [];
  
  try {
    // Step 1: Log the input parameters
    logs.push(`Received parameters: ${JSON.stringify(params)}`);
    
    // Step 2: Connect to the database
    logs.push("Attempting to connect to MongoDB...");
    await connectToDB();
    logs.push("✅ Connected to MongoDB");

    const { name, username, bio, image, isPrivate, creatorId, clerkId } = params;

    // Step 3: Verify all required parameters
    if (!name) {
      logs.push("❌ Missing required field: name");
      return {
        success: false,
        error: "Community name is required",
        debug: logs.join("\n")
      };
    }

    if (!creatorId) {
      logs.push("❌ Missing required field: creatorId");
      return {
        success: false,
        error: "Creator ID is required",
        debug: logs.join("\n")
      };
    }

    // Step 4: Find the creator user
    logs.push(`Searching for user with id: ${creatorId}`);
    const user = await User.findOne({ id: creatorId });

    if (!user) {
      logs.push(`❌ User not found with id: ${creatorId}`);
      return {
        success: false,
        error: "Creator user not found",
        debug: logs.join("\n")
      };
    }

    logs.push(`✅ Found user: ${user._id} (${user.name || 'unnamed'})`);

    // Step 5: Create community document
    logs.push("Creating new community document...");
    const communityUsername = username || name.toLowerCase().replace(/\s+/g, '-');
    
    // Check if a community with this username already exists
    const existingCommunity = await Community.findOne({ username: communityUsername });
    if (existingCommunity) {
      logs.push(`❌ Community with username '${communityUsername}' already exists`);
      return {
        success: false,
        error: `Community with username '${communityUsername}' already exists`,
        debug: logs.join("\n")
      };
    }

    const newCommunity = new Community({
      name,
      username: communityUsername,
      image: image || "",
      bio: bio || "",
      isPrivate: isPrivate || false,
      clerkId,
      createdBy: user._id,
      members: [user._id],
    });

    // Log the community document before saving
    logs.push(`Community document created: ${JSON.stringify(newCommunity)}`);

    // Step 6: Save the community to the database
    logs.push("Attempting to save community to database...");
    const savedCommunity = await newCommunity.save();
    logs.push(`✅ Community saved with ID: ${savedCommunity._id}`);

    // Step 7: Update user's communities list
    logs.push("Updating user's communities list...");
    if (user.communities) {
      user.communities.push(savedCommunity._id);
      await user.save();
      logs.push("✅ User communities list updated");
    } else {
      logs.push("⚠️ User doesn't have a communities field, skipping update");
    }

    // Final success response
    logs.push("✅ Community creation completed successfully");
    
    return {
      success: true,
      message: "Community created successfully",
      community: JSON.parse(JSON.stringify(savedCommunity)),
      debug: logs.join("\n")
    };
  } catch (error: any) {
    logs.push(`❌ Error: ${error.message}`);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      logs.push("This appears to be a duplicate key error (MongoDB code 11000)");
      
      if (error.keyPattern) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        logs.push(`Duplicate field: ${duplicateField}`);
      }
    }

    console.error("Diagnostic community creation failed:", error);
    console.error("Diagnostic logs:", logs.join("\n"));
    
    return {
      success: false,
      error: error.message || "Failed to create community",
      debug: logs.join("\n")
    };
  }
}

/**
 * Validates MongoDB connection and reports its status
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await connectToDB();
    
    // Try to fetch a document to verify connection is working
    const count = await Community.countDocuments({}).limit(1);
    
    return {
      connected: true,
      message: `Connected to MongoDB. Found ${count} communities.`
    };
  } catch (error: any) {
    console.error("Database connection check failed:", error);
    return {
      connected: false,
      message: `Failed to connect to MongoDB: ${error.message}`
    };
  }
}