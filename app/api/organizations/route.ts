import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * API route for creating a Clerk organization
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { name, slug } = body;
    
    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Create the organization in Clerk with the required createdBy parameter
    const organization = await clerkClient.organizations.createOrganization({
      name,
      slug: slug || undefined, // Clerk will generate a slug if undefined
      createdBy: userId, // This is the required parameter
    });

    // Create a membership for the current user
    await clerkClient.organizations.createOrganizationMembership({
      organizationId: organization.id,
      userId,
      role: "admin",
    });

    // Return the created organization
    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt
    });
  } catch (error: any) {
    console.error("Error creating organization:", error);
    
    // Handle specific Clerk errors
    if (error.clerkError) {
      return NextResponse.json(
        { 
          error: "Clerk API Error", 
          message: error.errors?.[0]?.message || error.message 
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: "Failed to create organization", message: error.message },
      { status: 500 }
    );
  }
}
