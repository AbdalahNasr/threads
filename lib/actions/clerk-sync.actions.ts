"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { connectToDB } from "../mongoose";
import Community from "../models/community.model";
import User from "../models/user.model";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

// Define our own types for Clerk data structures
interface ClerkOrganization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

interface ClerkMembership {
  organization: ClerkOrganization;
  role: string;
}

interface SyncResult {
  success: boolean;
  error?: string;
  communities?: any[];
  message?: string;
}

interface CommunityResult extends SyncResult {
  communityId?: mongoose.Types.ObjectId;
  existing?: boolean;
}

/**
 * Helper function to retry a promise with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500,
  multiplier = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Retrying after ${delay}ms, ${retries} retries left`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return withRetry(fn, retries - 1, delay * multiplier, multiplier);
  }
}

/**
 * Synchronizes Clerk organizations with MongoDB communities
 * @param userId The Clerk user ID
 */
export async function syncClerkOrganizations(userId: string): Promise<SyncResult> {
  const syncStartTime = Date.now();
  console.log(`Starting Clerk sync for user ${userId}`);
  
  try {
    // Connect to the database
    await connectToDB();

    // Get user from our database
    const mongoUser = await User.findOne({ id: userId });
    if (!mongoUser) {
      console.error(`User ${userId} not found in MongoDB`);
      return { success: false, error: "User not found in MongoDB" };
    }

    try {
      // Fetch organizations from Clerk with retry mechanism
      const response = await withRetry(
        () => clerkClient.users.getOrganizationMembershipList({ userId }),
        3, // 3 retries
        500 // starting with 500ms delay, will increase exponentially
      );
      
      // Extract organization IDs from memberships
      const memberships = response.data as unknown as ClerkMembership[];
      
      if (!Array.isArray(memberships)) {
        console.error("Invalid response format from Clerk API:", response);
        return { 
          success: false, 
          error: "Invalid response format from Clerk API" 
        };
      }
      
      console.log(`Found ${memberships.length} organizations for user ${userId} from Clerk`);
      
      const clerkOrgIds = memberships.map(membership => membership.organization.id);

      // Get existing communities in MongoDB that are associated with these Clerk organizations
      const existingCommunities = await Community.find({ clerkId: { $in: clerkOrgIds } });
      console.log(`Found ${existingCommunities.length} existing communities in MongoDB`);
      
      const existingClerkIds = existingCommunities.map(community => community.clerkId);

      // Determine which organizations need to be added
      const newOrgIds = clerkOrgIds.filter(orgId => !existingClerkIds.includes(orgId));
      console.log(`Need to create ${newOrgIds.length} new communities`);

      // Create new communities for missing organizations
      const newCommunities = [];
      
      for (const orgId of newOrgIds) {
        try {
          // Get detailed organization data from Clerk with retry
          const orgDetails = await withRetry(
            () => clerkClient.organizations.getOrganization({ organizationId: orgId }),
            3
          );
          
          // Create a new community record in MongoDB
          const newCommunity = new Community({
            id: orgId, // Using the Clerk organization ID as our ID
            clerkId: orgId,
            name: orgDetails.name || "Unnamed Organization",
            username: orgDetails.slug || `org-${Date.now()}`,
            image: orgDetails.imageUrl || "",
            bio: "",
            createdBy: mongoUser._id,
            members: [mongoUser._id],
            threads: []
          });

          await newCommunity.save();
          newCommunities.push(newCommunity);
          console.log(`Created new community for organization: ${orgDetails.name} (${orgId})`);
        } catch (orgError) {
          console.error(`Error processing organization ${orgId}:`, orgError);
          // Continue with other organizations even if one fails
        }
      }

      // Update existing communities with latest information
      const updatedCommunities = [];
      
      for (const community of existingCommunities) {
        try {
          const orgDetails = await withRetry(
            () => clerkClient.organizations.getOrganization({ 
              organizationId: community.clerkId 
            }),
            2
          );
          
          // Only update if we got valid data
          if (orgDetails && orgDetails.name) {
            // Update community details
            let wasUpdated = false;
            
            if (community.name !== orgDetails.name) {
              community.name = orgDetails.name;
              wasUpdated = true;
            }
            
            if (community.username !== orgDetails.slug) {
              community.username = orgDetails.slug;
              wasUpdated = true;
            }
            
            if (community.image !== orgDetails.imageUrl) {
              community.image = orgDetails.imageUrl;
              wasUpdated = true;
            }
            
            // Add the user as a member if not already a member
            const memberExists = community.members.some(
              (memberId: mongoose.Types.ObjectId) => memberId.equals(mongoUser._id)
            );
            
            if (!memberExists) {
              community.members.push(mongoUser._id);
              wasUpdated = true;
            }
            
            if (wasUpdated) {
              await community.save();
              updatedCommunities.push(community);
              console.log(`Updated community: ${community.name} (${community.clerkId})`);
            } else {
              console.log(`No changes needed for community: ${community.name} (${community.clerkId})`);
            }
          }
        } catch (commError) {
          console.error(`Error updating community ${community.clerkId}:`, commError);
          // Continue with other communities even if one fails
        }
      }

      // Revalidate relevant paths to ensure data is fresh
      revalidatePath('/communities');
      
      // Track sync duration
      const syncDuration = Date.now() - syncStartTime;
      console.log(`Clerk sync completed in ${syncDuration}ms`);

      return { 
        success: true,
        message: `Synchronized ${newCommunities.length} new and ${updatedCommunities.length} existing communities`,
        communities: [...newCommunities, ...existingCommunities]
      };
    } catch (clerkError: any) {
      // Handle Clerk API errors specifically
      console.error("Clerk API Error:", clerkError);
      
      // Check if we have communities for this user already
      // If we do, return success but with a warning
      const userCommunities = await Community.find({ members: mongoUser._id });
      
      if (userCommunities.length > 0) {
        console.log(`Returning ${userCommunities.length} existing communities despite Clerk API error`);
        
        // Revalidate path even with error to ensure consistent UI
        revalidatePath('/communities');
        
        return { 
          success: true, 
          error: "Using existing communities data due to Clerk API issue",
          communities: userCommunities,
          message: `Found ${userCommunities.length} existing communities, but couldn't sync with Clerk`
        };
      }
      
      // If no communities found, propagate the error
      return { 
        success: false, 
        error: `Clerk API Error: ${clerkError.message || "Unknown error"}` 
      };
    }
  } catch (error: any) {
    console.error("Error syncing organizations:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a MongoDB community from a Clerk organization
 * @param orgId The Clerk organization ID
 * @param userId The Clerk user ID
 */
export async function createCommunityFromOrganization(
  orgId: string, 
  userId: string
): Promise<CommunityResult> {
  console.log(`Creating community for Clerk organization ${orgId}, user ${userId}`);
  
  try {
    await connectToDB();
    
    // Check if the community already exists
    const existingCommunity = await Community.findOne({ clerkId: orgId });
    if (existingCommunity) {
      console.log(`Community already exists for organization ${orgId}`);
      return { 
        success: true, 
        communityId: existingCommunity._id, 
        existing: true 
      };
    }
    
    // Get the MongoDB user
    const mongoUser = await User.findOne({ id: userId });
    if (!mongoUser) {
      console.error(`User ${userId} not found in MongoDB`);
      return { success: false, error: "User not found in MongoDB" };
    }
    
    try {
      // Get organization details from Clerk with retry
      const orgDetails = await withRetry(
        () => clerkClient.organizations.getOrganization({ organizationId: orgId }),
        3
      );
      
      if (!orgDetails || !orgDetails.name) {
        return { 
          success: false, 
          error: "Invalid organization data received from Clerk" 
        };
      }
      
      // Create new community
      const newCommunity = new Community({
        id: orgId,
        clerkId: orgId,
        name: orgDetails.name,
        username: orgDetails.slug || orgId.toLowerCase(),
        image: orgDetails.imageUrl || "",
        bio: "",
        createdBy: mongoUser._id,
        members: [mongoUser._id],
        threads: []
      });
      
      await newCommunity.save();
      console.log(`Successfully created community for org ${orgId}: ${orgDetails.name}`);
      
      // Revalidate paths to ensure fresh data
      revalidatePath('/communities');
      
      return { 
        success: true, 
        communityId: newCommunity._id, 
        existing: false 
      };
    } catch (clerkError: any) {
      console.error("Clerk API Error in createCommunityFromOrganization:", clerkError);
      return { 
        success: false, 
        error: `Clerk API Error: ${clerkError.message || "Unknown error"}` 
      };
    }
  } catch (error: any) {
    console.error("Error creating community from organization:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove communities that no longer exist in Clerk
 * @param userId The Clerk user ID
 */
export async function cleanupDeletedOrganizations(userId: string): Promise<SyncResult> {
  console.log(`Cleaning up deleted organizations for user ${userId}`);
  
  try {
    await connectToDB();
    
    // Get user from our database
    const mongoUser = await User.findOne({ id: userId });
    if (!mongoUser) {
      return { success: false, error: "User not found in MongoDB" };
    }
    
    // Get all communities where the user is a member
    const userCommunities = await Community.find({ members: mongoUser._id });
    
    if (userCommunities.length === 0) {
      return { success: true, message: "No communities to clean up" };
    }
    
    try {
      // Get organizations from Clerk
      const response = await withRetry(
        () => clerkClient.users.getOrganizationMembershipList({ userId }),
        3
      );
      
      const memberships = response.data as unknown as ClerkMembership[];
      const clerkOrgIds = memberships.map(membership => membership.organization.id);
      
      // Find communities that have clerkIds but are no longer in the user's Clerk organizations
      const communitiesToUpdate = userCommunities.filter(
        community => community.clerkId && !clerkOrgIds.includes(community.clerkId)
      );
      
      console.log(`Found ${communitiesToUpdate.length} communities to remove user from`);
      
      // Remove user from these communities
      let updatedCount = 0;
      
      for (const community of communitiesToUpdate) {
        // Remove user from members
        community.members = community.members.filter(
          (memberId: mongoose.Types.ObjectId) => !memberId.equals(mongoUser._id)
        );
        
        await community.save();
        updatedCount++;
      }
      
      if (updatedCount > 0) {
        revalidatePath('/communities');
      }
      
      return { 
        success: true, 
        message: `Removed user from ${updatedCount} communities that were deleted in Clerk`
      };
    } catch (clerkError: any) {
      console.error("Clerk API Error during cleanup:", clerkError);
      return { 
        success: false, 
        error: `Clerk API Error: ${clerkError.message || "Unknown error"}` 
      };
    }
  } catch (error: any) {
    console.error("Error cleaning up deleted organizations:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Comprehensive sync that handles all Clerk-MongoDB synchronization needs
 * @param userId The Clerk user ID
 */
export async function fullClerkSync(userId: string): Promise<SyncResult> {
  console.log(`Starting full Clerk sync for user ${userId}`);
  
  try {
    // Step 1: Sync organizations from Clerk to MongoDB
    const syncResult = await syncClerkOrganizations(userId);
    
    if (!syncResult.success) {
      return syncResult;
    }
    
    // Step 2: Cleanup deleted organizations
    const cleanupResult = await cleanupDeletedOrganizations(userId);
    
    // Combine results
    return {
      success: true,
      message: `Sync complete. ${syncResult.message}. ${cleanupResult.message}`,
      communities: syncResult.communities
    };
  } catch (error: any) {
    console.error("Error in full Clerk sync:", error);
    return { success: false, error: error.message };
  }
}