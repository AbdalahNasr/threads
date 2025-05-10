import { NextResponse } from "next/server";
import { getAuth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongoose";
import Community from "@/lib/models/community.model";
import User from "@/lib/models/user.model";
import { Types } from "mongoose";

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

// Define clerk organization membership interface
interface OrganizationMembership {
  organization: {
    id: string;
    slug: string | null;
    name: string;
    imageUrl: string;
  };
}

// GET: Fetch all communities for the current user
export async function GET(request: Request) {
  try {
    // Get the authenticated user using getAuth instead of auth
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated user ID:", userId);

    // Connect to the database
    await connectToDB();
    console.log("Connected to database");

    // Find the MongoDB user document that corresponds to the Clerk userId
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      console.log("User not found in database");
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    console.log("Found user in database:", user._id);

    // Get communities from MongoDB using the MongoDB ObjectId
    const userCommunities = await Community.find({
      members: { $in: [user._id] }
    });

    console.log("Found communities in database:", userCommunities.length);

    // If we have communities in the database, return them
    if (userCommunities && userCommunities.length > 0) {
      return NextResponse.json(userCommunities);
    }

    // If no communities in the database, sync from Clerk
    console.log("No communities found in database, syncing from Clerk");
    
    // Get the current user with their organization memberships
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: "Clerk user not found" }, { status: 404 });
    }
    
    console.log("Fetched current user from Clerk");
    
    // Access organization memberships directly from the user object
    const memberships = clerkUser.organizationMemberships || [];
    
    console.log("Fetched memberships from Clerk:", memberships.length);
    
    if (memberships.length === 0) {
      console.log("No memberships found in Clerk, returning empty array");
      return NextResponse.json([]);
    }
    
    // Format the organizations as communities and save to database
    const clerkCommunities = await Promise.all(memberships.map(async (membership: OrganizationMembership) => {
      console.log("Processing membership:", membership.organization.id);
      
      // Create or update the community in the database
      const communityData: CommunityData = {
        id: membership.organization.id,
        username: membership.organization.slug || `org-${membership.organization.id}`,
        name: membership.organization.name,
        image: membership.organization.imageUrl,
        bio: "Community imported from Clerk",
        createdBy: user._id // Use the MongoDB ObjectId
      };

      console.log("Community data:", communityData);

      // Check if community already exists
      const existingCommunity = await Community.findOne({ id: communityData.id });
      
      if (existingCommunity) {
        console.log("Updating existing community:", existingCommunity._id);
        // Update existing community
        existingCommunity.name = communityData.name;
        existingCommunity.image = communityData.image;
        existingCommunity.bio = communityData.bio;
        
        // Make sure the user is a member
        if (!existingCommunity.members.includes(user._id)) {
          existingCommunity.members.push(user._id);
        }
        
        await existingCommunity.save();
        return existingCommunity;
      } else {
        console.log("Creating new community");
        // Create new community
        const newCommunity = new Community({
          ...communityData,
          members: [user._id], // Use the MongoDB ObjectId
          threads: []
        });
        await newCommunity.save();
        console.log("Created new community:", newCommunity._id);
        return newCommunity;
      }
    }));

    console.log("Returning communities from Clerk:", clerkCommunities.length);
    return NextResponse.json(clerkCommunities);
  } catch (error) {
    // Log the detailed error for debugging
    console.error("Error in communities API:", error);
    
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
export async function POST(request: Request) {
  try {
    // Get the authenticated user using getAuth instead of auth
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDB();

    // Find the MongoDB user document that corresponds to the Clerk userId
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Parse the request body
    const body: CreateCommunityRequest = await request.json();
    const { name, username, bio, image } = body;
    
    if (!name || !username) {
      return NextResponse.json({ error: "Name and username are required" }, { status: 400 });
    }

    // Check if a community with the same username already exists
    const existingCommunity = await Community.findOne({ username });
    
    if (existingCommunity) {
      return NextResponse.json({ error: "Community with this username already exists" }, { status: 409 });
    }

    // Create a new community in the database
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
    // Note: Clerk uses "organizations" in their API, but we refer to them as "communities" in our app
    try {
      const community = await clerkClient.organizations.createOrganization({
        name,
        slug: username,
        createdBy: userId
      });

      // Add the current user as an admin
      await clerkClient.organizations.createOrganizationMembership({
        organizationId: community.id,
        userId,
        role: "admin"
      });

      // Update the community with the Clerk community ID
      newCommunity.id = community.id;
    } catch (clerkError) {
      console.error("Error creating community in Clerk:", clerkError);
      // Continue even if Clerk community creation fails
    }

    // Save the community to the database
    await newCommunity.save();

    return NextResponse.json(newCommunity);
  } catch (error) {
    console.error("Error creating community:", error);
    
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
