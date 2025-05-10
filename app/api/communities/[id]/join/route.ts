import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Community from "@/lib/models/community.model";
import User from "@/lib/models/user.model";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const { userId } = await req.json();
    const communityId = params.id;

    // Find the community using either MongoDB _id or clerk organization id
    const isClerkId = communityId.startsWith('org_');
    const query = isClerkId ? { clerkId: communityId } : { _id: communityId };
    const community = await Community.findOne(query);

    if (!community) {
      return NextResponse.json(
        { success: false, error: "Community not found" },
        { status: 404 }
      );
    }

    // Find the user by clerk ID
    const user = await User.findOne({ id: userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already a member
    const isMember = community.members.some(
      (member: any) => member.toString() === user._id.toString()
    );

    if (isMember) {
      return NextResponse.json(
        { success: true, message: "Already a member", community },
        { status: 200 }
      );
    }

    // Add user to community members
    community.members.push(user._id);
    await community.save();

    // Add community to user's communities
    if (user.communities) {
      user.communities.push(community._id);
      await user.save();
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Successfully joined community",
        community: JSON.parse(JSON.stringify(community))
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error joining community:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to join community" 
      },
      { status: 500 }
    );
  }
}