/* eslint-disable camelcase */
import { Webhook, WebhookRequiredHeaders } from "svix";
import { headers } from 'next/headers';
import {
  addMemberToCommunity,
  createCommunity,
  deleteCommunity,
  removeUserFromCommunity,
  updateCommunityInfo,
} from "@/lib/actions/community.actions";
import { IncomingHttpHeaders } from "http";
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongoose";
import Community from "@/lib/models/community.model";
import User from "@/lib/models/user.model";

// Define supported event types
type EventType =
  | "organization.created"
  | "organizationInvitation.created"
  | "organizationMembership.created"
  | "organizationMembership.deleted"
  | "organization.updated"
  | "organization.deleted";

type Event = {
  data: Record<string, any>;
  object: "event";
  type: EventType;
};

export async function GET() {
  try {
    const { orgId, sessionClaims } = await auth();

    if (!orgId) {
      return NextResponse.json({ message: "User is not part of any organization" }, { status: 400 });
    }

    // Connect to the database
    await connectToDB();

    // Get the community information from the database
    const community = await Community.findOne({ id: orgId });

    if (!community) {
      return NextResponse.json({ 
        message: "Organization exists in Clerk but not in database", 
        orgId, 
        sessionClaims 
      });
    }

    return NextResponse.json({ 
      message: "User is in organization", 
      orgId, 
      sessionClaims,
      community
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 });
  }
}
// Webhook handler
export const POST = async (request: Request) => {
  console.log("Received webhook request");
if (request.method !== "POST") {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
  let payload;
  try {
    payload = await request.json(); 
    console.log("Payload received:", JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("Error parsing JSON payload:", error);
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const header = headers();
  const heads = {
 "svix-id": header.get("svix-id") ?? "",
  "svix-timestamp": header.get("svix-timestamp") ?? "",
    "svix-signature": header.get("svix-signature") ?? "",
  };

  console.log("Received headers:", heads);

  // Ensure the webhook secret is set
  const secret = process.env.NEXT_CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Webhook secret is missing in environment variables.");
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }

  const wh = new Webhook(secret);
  let evnt: Event | null = null;

  try {
    evnt = wh.verify(
      JSON.stringify(payload),
      heads as IncomingHttpHeaders & WebhookRequiredHeaders
    ) as Event;
    console.log("Verified event:", evnt);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ message: "Unauthorized" }, { status: 400 });
  }

  const eventType: EventType = evnt?.type!;
  console.log(`Processing event type: ${eventType}`);

  try {
    switch (eventType) {
      case "organization.created": {
        const { id, name, slug, logo_url, image_url, created_by } = evnt.data ?? {};
        
        // Connect to the database
        await connectToDB();
        
        // Check if the community already exists
        const existingCommunity = await Community.findOne({ id });
        if (existingCommunity) {
          console.log("Community already exists:", existingCommunity);
          return NextResponse.json({ message: "Community already exists" }, { status: 200 });
        }
        
        // Find the user in the database
        const user = await User.findOne({ id: created_by });
        if (!user) {
          console.error("User not found:", created_by);
          return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        // Create the community using the existing function
        await createCommunity(id, name, slug, logo_url || image_url, "Community created via webhook", created_by);
        
        return NextResponse.json({ message: "Organization created" }, { status: 201 });
      }

      case "organizationInvitation.created":
        console.log("Invitation created", evnt.data);
        return NextResponse.json({ message: "Invitation created" }, { status: 201 });

      case "organizationMembership.created": {
        const { organization, public_user_data } = evnt.data;
        
        // Connect to the database
        await connectToDB();
        
        // Check if the user exists in the database
        const user = await User.findOne({ id: public_user_data.user_id });
        if (!user) {
          console.error("User not found:", public_user_data.user_id);
          return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        // Check if the community exists
        const community = await Community.findOne({ id: organization.id });
        if (!community) {
          console.error("Community not found:", organization.id);
          return NextResponse.json({ message: "Community not found" }, { status: 404 });
        }
        
        // Add the user to the community using the existing function
        await addMemberToCommunity(organization.id, public_user_data.user_id);
        
        return NextResponse.json({ message: "Member added" }, { status: 201 });
      }

      case "organizationMembership.deleted": {
        const { organization, public_user_data } = evnt.data;
        
        // Connect to the database
        await connectToDB();
        
        // Check if the user exists in the database
        const user = await User.findOne({ id: public_user_data.user_id });
        if (!user) {
          console.error("User not found:", public_user_data.user_id);
          return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        // Check if the community exists
        const community = await Community.findOne({ id: organization.id });
        if (!community) {
          console.error("Community not found:", organization.id);
          return NextResponse.json({ message: "Community not found" }, { status: 404 });
        }
        
        // Remove the user from the community using the existing function
        await removeUserFromCommunity(public_user_data.user_id, organization.id);
        
        return NextResponse.json({ message: "Member removed" }, { status: 201 });
      }

      case "organization.updated": {
        const { id, logo_url, name, slug } = evnt.data;
        
        // Connect to the database
        await connectToDB();
        
        // Check if the community exists
        const community = await Community.findOne({ id });
        if (!community) {
          console.error("Community not found:", id);
          return NextResponse.json({ message: "Community not found" }, { status: 404 });
        }
        
        // Update the community using the existing function
        await updateCommunityInfo(id, name, slug, logo_url);
        
        return NextResponse.json({ message: "Organization updated" }, { status: 201 });
      }

      case "organization.deleted": {
        const { id } = evnt.data;
        
        // Connect to the database
        await connectToDB();
        
        // Check if the community exists
        const community = await Community.findOne({ id });
        if (!community) {
          console.error("Community not found:", id);
          return NextResponse.json({ message: "Community not found" }, { status: 404 });
        }
        
        // Delete the community using the existing function
        await deleteCommunity(id);
        
        return NextResponse.json({ message: "Organization deleted" }, { status: 201 });
      }

      default:
        console.warn("Unhandled event type:", eventType);
        return NextResponse.json({ message: "Event not handled" }, { status: 400 });
    }
  } catch (err) {
    console.error("Error processing event:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
