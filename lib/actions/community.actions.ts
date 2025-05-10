"use server";

import { connectToDB } from "../mongoose";
import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { revalidatePath } from "next/cache";
import { 
  Community as CommunityType, 
  CommunitiesResponse, 
  CommunityCreationParams,
  CommunityUpdateParams,
  CommunityOperationResult,
  FetchCommunitiesParams
} from "@/lib/types/community.types";
import { toast } from "@/components/ui/use-toast";

/**
 * Fetch posts/threads associated with a community
 * @param communityId The ID of the community (can be MongoDB _id or Clerk organization ID)
 */
export async function fetchCommunityPosts(communityId: string): Promise<any[]> {
  try {
    await connectToDB();

    // Determine if this is a MongoDB ObjectId or a Clerk organization ID
    const isClerkId = communityId.startsWith('org_');
    
    // Create the appropriate query based on the ID format
    const query = isClerkId 
      ? { clerkId: communityId } // If it's a Clerk ID, query by clerkId field
      : { _id: communityId };    // Otherwise, assume it's a MongoDB _id

    // Find the community with the given ID
    const community = await Community.findOne(query)
      .populate({
        path: "threads",
        model: Thread,
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name image username"
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name image username"
            }
          }
        ]
      });

    if (!community) {
      throw new Error("Community not found");
    }

    // Return the threads associated with the community
    return community.threads || [];
  } catch (error) {
    console.error("Error fetching community posts:", error);
    throw error;
  }
}

/**
 * Fetches details of a specific community by ID
 * @param communityId The ID of the community to fetch (can be MongoDB _id or Clerk organization ID)
 */
export async function fetchCommunityDetails(communityId: string): Promise<CommunityType | null> {
  try {
    await connectToDB();

    // Determine if this is a MongoDB ObjectId or a Clerk organization ID
    const isClerkId = communityId.startsWith('org_');
    
    // Create the appropriate query based on the ID format
    const query = isClerkId 
      ? { clerkId: communityId } // If it's a Clerk ID, query by clerkId field
      : { $or: [{ _id: communityId }, { id: communityId }] }; // Try both _id and id fields
    
    console.log(`Searching for community with query:`, query);
    
    // Use findOne with the appropriate query rather than findById
    const communityQuery = await Community.findOne(query)
      .populate({
        path: "members",
        model: User,
        select: "_id id name username image"
      })
      .populate({
        path: "threads",
        model: Thread,
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name username image"
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name username image"
            }
          }
        ]
      });

    if (!communityQuery) {
      console.log(`No community found for ID: ${communityId}`);
      toast({
        title: "Community not found",
        description: "The requested community could not be found.",
        variant: "destructive",
      });
      return null;
    }

    console.log(`Found community: ${communityQuery.name}`);
    return JSON.parse(JSON.stringify(communityQuery));
  } catch (error) {
    console.error("Error fetching community details:", error);
    toast({
      title: "Error",
      description: "Failed to fetch community details.",
      variant: "destructive",
    });
    throw error;
  }
}

/**
 * Function to get community by Clerk organization ID
 */
export async function fetchCommunityByClerkId(clerkOrgId: string): Promise<CommunityType | null> {
  try {
    await connectToDB();

    if (!clerkOrgId) {
      return null; // Return null for personal account
    }

    const community = await Community.findOne({ clerkId: clerkOrgId })
      .populate({
        path: "members",
        model: User,
        select: "_id id name username image"
      })
      .populate({
        path: "threads",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "name image id"
        }
      });

    if (!community) {
      return null;
    }

    return JSON.parse(JSON.stringify(community));
  } catch (error) {
    console.error("Error fetching community by Clerk ID:", error);
    throw error;
  }
}

/**
 * Add a member to a community
 */
export async function addMemberToCommunity(
  communityId: string,
  memberId: string
): Promise<CommunityOperationResult> {
  try {
    await connectToDB();

    // Determine if this is a MongoDB ObjectId or a Clerk organization ID
    const isClerkId = communityId.startsWith('org_');
    const query = isClerkId ? { id: communityId } : { _id: communityId };

    const community = await Community.findOne(query);
    if (!community) {
      return { success: false, error: "Community not found" };
    }

    const userToAdd = await User.findOne({ id: memberId });
    if (!userToAdd) {
      return { success: false, error: "User not found" };
    }

    const isMember = community.members.some(
      (member: any) => member.toString() === userToAdd._id.toString()
    );
    if (isMember) {
      return { success: false, error: "Already a member" };
    }

    community.members.push(userToAdd._id);
    await community.save();

    if (!userToAdd.communities) {
      userToAdd.communities = [];
    }
    userToAdd.communities.push(community._id);
    await userToAdd.save();

    revalidatePath('/communities');
    revalidatePath(`/communities/${communityId}`);

    return { 
      success: true, 
      message: "Successfully joined community",
      community: JSON.parse(JSON.stringify(community))
    };
  } catch (error: any) {
    console.error("Error adding member to community:", error);
    return { success: false, error: error.message || "Failed to join community" };
  }
}

/**
 * Remove a member from a community
 * @param communityId The ID of the community
 * @param userId The ID of the user to remove
 */
export async function removeMemberFromCommunity(communityId: string, userId: string): Promise<CommunityOperationResult> {
  try {
    await connectToDB();

    // Determine if this is a MongoDB ObjectId or a Clerk organization ID
    const isClerkId = communityId.startsWith('org_');
    
    // Create the appropriate query based on the ID format
    const query = isClerkId 
      ? { clerkId: communityId } // If it's a Clerk ID, query by clerkId field
      : { _id: communityId };    // Otherwise, assume it's a MongoDB _id

    // Find the community by the appropriate ID
    const community = await Community.findOne(query);

    if (!community) {
      toast({
        title: "Community not found",
        description: "The requested community could not be found.",
        variant: "destructive",
      });
      return { 
        success: false, 
        error: "Community not found" 
      };
    }

    // Find the user by clerk ID
    const user = await User.findOne({ id: userId });

    if (!user) {
      toast({
        title: "User not found",
        description: "The specified user could not be found.",
        variant: "destructive",
      });
      return { 
        success: false, 
        error: "User not found" 
      };
    }

    // Check if user is a member
    const isMember = community.members.some(
      (member: any) => member.toString() === user._id.toString()
    );

    if (!isMember) {
      toast({
        title: "Not a member",
        description: "The user is not a member of this community.",
        variant: "warning",
      });
      return { 
        success: true, 
        message: "User is not a member",
        community: JSON.parse(JSON.stringify(community))
      };
    }

    // Remove user from community members
    community.members = community.members.filter(
      (member: any) => member.toString() !== user._id.toString()
    );
    
    await community.save();

    // Remove community from user's communities if that field exists
    if (user.communities) {
      user.communities = user.communities.filter(
        (comm: any) => comm.toString() !== community._id.toString()
      );
      await user.save();
    }

    toast({
      title: "Success",
      description: "Successfully left the community!",
      variant: "success",
    });

    // Revalidate multiple paths to ensure cache is refreshed everywhere
    revalidatePath(`/communities/${communityId}`);
    revalidatePath('/communities');
    
    return { 
      success: true,
      message: "Successfully left community",
      community: JSON.parse(JSON.stringify(community))
    };
  } catch (error: any) {
    console.error("Error removing member from community:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to leave community",
      variant: "destructive",
    });
    return { success: false, error: error.message };
  }
}

/**
 * Create a new community
 */
export async function createCommunity(params: CommunityCreationParams): Promise<CommunityOperationResult> {
  const startTime = performance.now();

  try {
    await connectToDB();
    const dbStartTime = performance.now();

    const { name, username, bio, image, isPrivate, creatorId, clerkId } = params;

    // Find the creator user
    const user = await User.findOne({ id: creatorId });

    if (!user) {
      toast({
        title: "Error",
        description: "Creator user not found",
        variant: "destructive",
      });
      return {
        success: false,
        error: "Creator user not found"
      };
    }

    // Create a new community
    const newCommunity = new Community({
      name,
      username: username || name.toLowerCase().replace(/\s+/g, '-'),
      image: image || "",
      bio: bio || "",
      isPrivate: isPrivate || false,
      clerkId,
      createdBy: user._id,
      members: [user._id],
    });

    // Save the community to the database
    const savedCommunity = await newCommunity.save();
    const dbEndTime = performance.now();

    // Add the community to the creator's communities
    if (user.communities) {
      user.communities.push(savedCommunity._id);
      await user.save();
    }

    // Revalidate community-related paths
    revalidatePath('/communities');

    const totalTime = performance.now() - startTime;
    
    console.log({
      totalOperationTime: `${totalTime.toFixed(2)}ms`,
      dbOperationTime: `${(dbEndTime - dbStartTime).toFixed(2)}ms`,
      stateUpdateTime: `${(performance.now() - dbEndTime).toFixed(2)}ms`
    });

    toast({
      title: "Success",
      description: "Community created successfully!",
      variant: "success",
    });

    return {
      success: true,
      message: "Community created successfully",
      community: JSON.parse(JSON.stringify(savedCommunity)),
      timing: {
        total: totalTime,
        db: dbEndTime - dbStartTime,
        stateUpdate: performance.now() - dbEndTime
      }
    };
  } catch (error: any) {
    console.error("Error creating community:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to create community",
      variant: "destructive",
    });
    return {
      success: false,
      error: error.message || "Failed to create community"
    };
  }
}

/**
 * Create a new community with performance tracking
 */
export async function createCommunityWithPerformance(data: CreateCommunityParams) {
  const startTime = performance.now();
  
  try {
    connectToDB();
    
    const dbStartTime = performance.now();
    const createdCommunity = await Community.create(data);
    const dbEndTime = performance.now();
    
    const totalTime = performance.now() - startTime;
    
    console.log({
      totalTime: `${totalTime.toFixed(2)}ms`,
      dbTime: `${(dbEndTime - dbStartTime).toFixed(2)}ms`,
      stateUpdateTime: `${(performance.now() - dbEndTime).toFixed(2)}ms`
    });

    return createdCommunity;
  } catch (error) {
    console.error("Error creating community:", error);
    throw error;
  }
}

/**
 * Get user communities (communities where the user is a member)
 */
export async function getUserCommunities(userId: string): Promise<CommunityType[]> {
  try {
    await connectToDB();

    // Find the user
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Find communities where user is a member
    const communities = await Community.find({
      members: user._id
    })
    .populate("members");

    return JSON.parse(JSON.stringify(communities));
  } catch (error) {
    console.error("Error fetching user communities:", error);
    throw error;
  }
}

/**
 * Fetch communities by search string with pagination and cache control
 * Enhanced to support userId filtering and better cache control
 */
export async function fetchCommunities(params: FetchCommunitiesParams = {}): Promise<CommunitiesResponse> {
  try {
    await connectToDB();

    const {
      searchString = "",
      pageNumber = 1,
      pageSize = 20,
      skipCache = false,
      userId = "", // Now properly handling userId parameter
      _cache
    } = params;

    // Add log for debugging
    console.log(`Fetching communities: searchString=${searchString}, page=${pageNumber}, pageSize=${pageSize}, skipCache=${skipCache}`);

    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive search filter
    const regex = new RegExp(searchString, "i");

    // Build the query filter
    const query = searchString.trim() !== "" 
      ? {
          $or: [
            { name: { $regex: regex } },
            { username: { $regex: regex } },
          ],
        } 
      : {};

    let userObj = null;
    if (userId) {
      // Find the user to get MongoDB _id if userId is provided
      userObj = await User.findOne({ id: userId });
      console.log(`Found user for userId ${userId}:`, userObj ? "yes" : "no");
    }

    // Fetch communities with pagination
    const communitiesQuery = Community.find(query)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "members",
        model: User,
        select: "_id id name username image"
      });

    // Execute query
    const communities = await communitiesQuery.exec();

    // Log success for debugging
    console.log(`Found ${communities.length} communities from DB`);

    // Ensure each community has required fields and add membership info
    const processedCommunities = communities.map(community => {
      // Convert to plain object if it's a mongoose document
      const plainCommunity = community.toObject ? community.toObject() : community;
      
      // Check if the user is a member of this community
      let isUserMember = false;
      if (userObj) {
        isUserMember = plainCommunity.members.some(
          (member: any) => {
            const memberId = member._id ? member._id.toString() : member.toString();
            return memberId === userObj._id.toString();
          }
        );
      }
      
      // Ensure required fields exist
      return {
        ...plainCommunity,
        id: plainCommunity.id || plainCommunity._id?.toString() || '',
        _id: plainCommunity._id?.toString() || plainCommunity.id || '',
        name: plainCommunity.name || 'Unnamed Community',
        // Ensure members is always an array
        members: Array.isArray(plainCommunity.members) ? plainCommunity.members : [],
        // Add user membership flag for convenience
        isUserMember
      };
    });

    // Count total documents for pagination
    const totalCommunitiesCount = await Community.countDocuments(query);

    const isNext = totalCommunitiesCount > skipAmount + communities.length;

    // Log success for debugging
    console.log(`Processed ${processedCommunities.length} communities out of ${totalCommunitiesCount} total`);

    // If skipCache is true, revalidate the path to ensure fresh data
    if (skipCache) {
      revalidatePath('/communities');
    }

    return { 
      communities: JSON.parse(JSON.stringify(processedCommunities)), 
      isNext,
      totalCommunitiesCount
    };
  } catch (error) {
    console.error("Error fetching communities:", error);
    // Return empty array on error instead of throwing
    return { 
      communities: [], 
      isNext: false,
      totalCommunitiesCount: 0
    };
  }
}

/**
 * Fetch suggested communities for a user
 * @param userId The ID of the user
 * @param limit Maximum number of communities to return
 */
export async function fetchSuggestedCommunities(userId: string, limit: number = 3): Promise<CommunityType[]> {
  try {
    await connectToDB();

    // Find the user
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Find communities the user is not a member of
    const suggestedCommunities = await Community.find({
      members: { $nin: [user._id] }
    })
      .sort({ createdAt: -1 }) // Get newest communities first
      .limit(limit)
      .populate({
        path: "members",
        model: User,
        select: "_id id name username image"
      });

    return JSON.parse(JSON.stringify(suggestedCommunities));
  } catch (error) {
    console.error("Error fetching suggested communities:", error);
    return []; // Return empty array instead of throwing to avoid breaking the page
  }
}

/**
 * Join a community
 * @param communityId The ID of the community
 * @param userId The ID of the user
 */
export async function joinCommunity({ communityId, userId }: { communityId: string, userId: string }) {
  try {
    // Call the existing addMemberToCommunity function
    const result = await addMemberToCommunity(communityId, userId);
    
    // No need to revalidate the path since we're handling UI updates client-side
    return result;
  } catch (error) {
    console.error("Error joining community:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join community"
    };
  }
}