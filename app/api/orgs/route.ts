import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongoose";
import Community from "@/lib/models/community.model";
import User from "@/lib/models/user.model";

// GET: Fetch all organizations/communities for the current user
export async function GET() {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
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

    // Return the communities from the database
    return NextResponse.json(userCommunities);
  } catch (error) {
    // Log the detailed error for debugging
    console.error("Error in organizations API:", error);
    
    // Return a more helpful error message if possible
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "API error", message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "API error" },
      { status: 500 }
    );
  }
}

// POST: Create a new organization/community
export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
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
    const body = await request.json();
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
      id: `community_${Date.now()}`, // Temporary ID, will be updated with Clerk org ID
      name,
      username,
      bio: bio || "",
      image: image || "",
      createdBy: user._id,
      members: [user._id],
      threads: []
    });

    // Create a corresponding organization in Clerk
    try {
      // Use the new function approach for clerkClient
      const clerk = clerkClient();
        
      const organization = await clerk.organizations.createOrganization({
        name,
        slug: username,
        createdBy: userId
      });

      // Add the current user as an admin
      await clerk.organizations.createOrganizationMembership({
        organizationId: organization.id,
        userId,
        role: "admin"
      });

      // Update the community with the Clerk organization ID
      newCommunity.id = organization.id;
    } catch (clerkError) {
      console.error("Error creating organization in Clerk:", clerkError);
      // Continue even if Clerk organization creation fails
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
