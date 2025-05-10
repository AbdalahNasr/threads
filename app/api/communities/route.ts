
import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Community from "@/lib/models/community.model";
import User from "@/lib/models/user.model";
import { Types } from "mongoose";
import { auth, clerkClient } from "@clerk/nextjs/server";

// Define proper interface for community data
interface CommunityData {
  id: string;
  username: string;
  name: string;
  image: string;
  bio: string;
  createdBy: Types.ObjectId;
  members?: Types.ObjectId[];
  threads?: Types.ObjectId[];
}

// Create a simple logger with timestamps for better debugging
const logger = {
  info: (message: string, data?: any) => {
    if (data) {
      // Convert data to plain object to avoid toJSON methods
      try {
        const safeData = JSON.parse(JSON.stringify(data));
        console.log(`[COMMUNITIES-API-INFO] ${message}`, safeData);
      } catch (e) {
        console.log(`[COMMUNITIES-API-INFO] ${message} (data not serializable)`);
      }
    } else {
      console.log(`[COMMUNITIES-API-INFO] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[COMMUNITIES-API-ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`[COMMUNITIES-API-ERROR] ${error.message}`);
        console.error(`[COMMUNITIES-API-ERROR] ${error.stack}`);
      } else {
        try {
          console.error(`[COMMUNITIES-API-ERROR] ${JSON.stringify(error)}`);
        } catch (e) {
          console.error(`[COMMUNITIES-API-ERROR] (error not serializable)`);
        }
      }
    }
  }
};

// Helper function to safely serialize objects
function safeSerialize(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

// GET: Fetch all communities for the current user
export async function GET(request: NextRequest) {
  logger.info('Communities API: GET request started');
  
  try {
    // Get the authenticated user using auth() instead of getAuth()
    // This will work with the authMiddleware
    const { userId } = await auth();
    
    if (!userId) {
      logger.error('No userId found in auth object');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info(`Authenticated user ID: ${userId}`);

    // Connect to the database
    try {
      await connectToDB();
      logger.info('Connected to database');
    } catch (dbError) {
      logger.error('Failed to connect to database', dbError);
      return NextResponse.json({ 
        error: "Database connection error",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

    // Find the MongoDB user document that corresponds to the Clerk userId
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      logger.error(`User not found in database for Clerk ID: ${userId}`);
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    logger.info(`Found user in database with id: ${user.id}`);

    // Get communities from MongoDB using the MongoDB ObjectId
    const userCommunities = await Community.find({
      members: { $in: [user._id] }
    });

    logger.info(`Found ${userCommunities?.length || 0} communities in database`);

    // If we have communities in the database, return them
    if (userCommunities && userCommunities.length > 0) {
      logger.info('Returning communities from database');
      return NextResponse.json(safeSerialize(userCommunities));
    }

    // If no communities in the database, sync from Clerk
    logger.info('No communities found in database, syncing from Clerk');
    
    try {
      logger.info(`Fetching organization memberships for user ${userId} from Clerk`);
      // Fetch all organizations the user belongs to using Clerk API
      const membershipResponse = await clerkClient.users.getOrganizationMembershipList({
        userId
      });
      
      logger.info(`Received membership response from Clerk`);
      
      // Access the data array from the paginated response
      const userMemberships = membershipResponse.data || [];
      
      logger.info(`Fetched ${userMemberships.length} memberships from Clerk`);
      
      if (userMemberships.length === 0) {
        logger.info('No organizations found in Clerk, returning empty array');
        return NextResponse.json([]);
      }
      
      // Log each membership for debugging
      userMemberships.forEach((membership, index) => {
        logger.info(`Membership ${index + 1} organization ID: ${membership.organization.id}`);
      });
      
      // Get full organization details for each membership
      logger.info('Processing each organization membership to sync to database');
      const clerkCommunities = await Promise.all(userMemberships.map(async (membership) => {
        const organizationId = membership.organization.id;
        logger.info(`Processing organization: ${organizationId}`);
        
        try {
          // Get detailed organization info from Clerk
          logger.info(`Fetching detailed information for organization ${organizationId}`);
          const organization = await clerkClient.organizations.getOrganization({
            organizationId
          });
          
          logger.info(`Organization details received: ${organization.name}`);
          
          // Create or update the community in the database
          const communityData: CommunityData = {
            id: organization.id,
            username: organization.slug || `org-${organization.id}`,
            name: organization.name,
            image: organization.imageUrl,
            bio: "Community imported from Clerk",
            createdBy: user._id // Use the MongoDB ObjectId
          };

          logger.info(`Community data prepared for ${communityData.name}`);

          // Check if community already exists
          logger.info(`Checking if community already exists in database with id: ${communityData.id}`);
          const existingCommunity = await Community.findOne({ id: communityData.id });
          
          if (existingCommunity) {
            logger.info(`Updating existing community: ${existingCommunity.id}`);
            // Update existing community
            existingCommunity.name = communityData.name;
            existingCommunity.image = communityData.image;
            existingCommunity.bio = communityData.bio;
            
            // Make sure the user is a member
            const userIdInMembers = existingCommunity.members.some(
              (memberId: { toString: () => any; }) => memberId.toString() === user._id.toString()
            );
            
            if (!userIdInMembers) {
              logger.info(`Adding user to community members`);
              existingCommunity.members.push(user._id);
            }
            
            await existingCommunity.save();
            logger.info(`Community updated successfully`);
            return existingCommunity;
          } else {
            logger.info(`Creating new community for organization ${organization.id}`);
            // Create new community
            const newCommunity = new Community({
              ...communityData,
              members: [user._id], // Use the MongoDB ObjectId
              threads: []
            });
            await newCommunity.save();
            logger.info(`Created new community with id: ${newCommunity.id}`);
            return newCommunity;
          }
        } catch (orgError) {
          logger.error(`Error processing organization ${organizationId}:`, orgError);
          throw orgError; // Rethrow to be caught by the outer catch block
        }
      }));

      logger.info(`Successfully processed ${clerkCommunities.length} communities from Clerk`);
      return NextResponse.json(safeSerialize(clerkCommunities));
    } catch (clerkError) {
      logger.error('Error fetching data from Clerk:', clerkError);
      
      // Return a more helpful error message if possible
      return NextResponse.json(
        { error: "Failed to fetch communities from Clerk", details: String(clerkError) },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log the detailed error for debugging
    logger.error('Error in communities API:', error);
    
    // Return a more helpful error message if possible
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "API error", message: error.message, stack: error.stack },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "API error" },
      { status: 500 }
    );
  }
}

// Define interface for the request body
interface CreateCommunityRequest {
  name: string;
  username: string;
  bio?: string;
  image?: string;
}

// POST: Create a new community
export async function POST(request: NextRequest) {
  logger.info('Communities API: POST request started');
  
  try {
    // Get the authenticated user using auth() instead of getAuth()
    const { userId } = await auth();
    
    if (!userId) {
      logger.error('No userId found in auth object');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info(`Authenticated user ID: ${userId}`);

    // Connect to the database
    try {
      await connectToDB();
      logger.info('Connected to database');
    } catch (dbError) {
      logger.error('Failed to connect to database', dbError);
      return NextResponse.json({ 
        error: "Database connection error",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

    // Find the MongoDB user document that corresponds to the Clerk userId
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      logger.error(`User not found in database for Clerk ID: ${userId}`);
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Parse the request body
    const body: CreateCommunityRequest = await request.json();
    const { name, username, bio, image } = body;
    
    logger.info(`Create community request: ${name}, ${username}`);
    
    if (!name || !username) {
      logger.error('Missing required fields for community creation');
      return NextResponse.json({ error: "Name and username are required" }, { status: 400 });
    }

    // Check if a community with the same username already exists
    const existingCommunity = await Community.findOne({ username });
    
    if (existingCommunity) {
      logger.error(`Community with username "${username}" already exists`);
      return NextResponse.json({ error: "Community with this username already exists" }, { status: 409 });
    }

    // Create a new community in the database
    logger.info('Creating new community in database');
    const newCommunity = new Community({
      id: `community_${Date.now()}`, // Temporary ID, will be updated with Clerk community ID
      name,
      username,
      bio: bio || "",
      image: image || "",
      createdBy: user._id,
      members: [user._id],
      threads: []
    });

    // Create a corresponding community in Clerk
    logger.info('Creating corresponding organization in Clerk');
    try {
      const community = await clerkClient.organizations.createOrganization({
        name,
        slug: username,
        createdBy: userId
      });
      
      logger.info(`Created Clerk organization with ID: ${community.id}`);

      // Add the current user as an admin
      logger.info(`Adding user as admin to organization`);
      await clerkClient.organizations.createOrganizationMembership({
        organizationId: community.id,
        userId,
        role: "admin"
      });

      // Update the community with the Clerk community ID
      newCommunity.id = community.id;
      logger.info(`Updated community ID to Clerk organization ID: ${community.id}`);
    } catch (clerkError) {
      logger.error('Error creating community in Clerk:', clerkError);
      // Continue even if Clerk community creation fails
    }

    // Save the community to the database
    logger.info('Saving community to database');
    await newCommunity.save();
    logger.info(`Community saved successfully with ID: ${newCommunity.id}`);

    return NextResponse.json(safeSerialize(newCommunity));
  } catch (error) {
    logger.error('Error creating community:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to create community", message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 500 }
    );
  }
}
