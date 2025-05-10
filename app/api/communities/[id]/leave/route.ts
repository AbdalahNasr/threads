import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Community from "@/lib/models/community.model";
import User from "@/lib/models/user.model";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const { userId } = await req.json();
    const communityId = params.id;

    // Determine if this is a MongoDB ObjectId or a Clerk organization ID
    const isClerkId = communityId.startsWith('org_');
    
    // Create the appropriate query based on the ID format
    const query = isClerkId 
      ? { clerkId: communityId }
      : { _id: communityId };

    // Find community using the appropriate query
    const community = await Community.findOne(query);
    if (!community) {
      return NextResponse.json(
        { message: "Community not found" },
        { status: 404 }
      );
    }

    // Find user by clerk ID
    const user = await User.findOne({ id: userId });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is a member using MongoDB ObjectId comparison
    const isMember = community.members.some(
      (member: any) => member.toString() === user._id.toString()
    );

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this community" },
        { status: 400 }
      );
    }

    // Remove user from community members
    community.members = community.members.filter(
      (member: any) => member.toString() !== user._id.toString()
    );
    await community.save();

    // Remove community from user's communities if the field exists
    if (user.communities) {
      user.communities = user.communities.filter(
        (comm: any) => comm.toString() !== community._id.toString()
      );
      await user.save();
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully left community",
        community: JSON.parse(JSON.stringify(community))
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error leaving community:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to leave community",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}