import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createCommunityFromOrganization, syncClerkOrganizations } from "@/lib/actions/clerk-sync.actions";
import { getUserCommunities } from "@/lib/actions/community.actions";

export async function GET(request: NextRequest) {
  try {
    // Get parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const redirectUrl = searchParams.get("redirect") || "/communities";
    const orgId = searchParams.get("orgId");
    const userIdParam = searchParams.get("userId");
    
    // Get the user ID from the session if not provided in the params
    const { userId: authUserId } = await auth();
    const userId = userIdParam || authUserId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let syncResult;
    
    // Perform the appropriate sync action
    if (orgId) {
      // If an organization ID is provided, create/sync that specific organization
      syncResult = await createCommunityFromOrganization(orgId, userId);
      console.log(`Synced specific organization: ${orgId}`);
    } else {
      // Otherwise sync all organizations
      syncResult = await syncClerkOrganizations(userId);
      console.log(`Synced all organizations for user: ${userId}`);
    }
    
    // Even if we have a Clerk API error, we may still want to return communities data
    let fallbackCommunities = [];
    if (!syncResult.success) {
      // If sync failed, try to at least get existing communities
      try {
        fallbackCommunities = await getUserCommunities(userId);
        console.log(`Found ${fallbackCommunities.length} existing communities as fallback`);
      } catch (fallbackError) {
        console.error("Error getting fallback communities:", fallbackError);
      }
    }
    
    // If we need to redirect, do so; otherwise return a response
    if (request.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      return NextResponse.json({ 
        success: syncResult.success,
        error: syncResult.error,
        hasFallbackData: fallbackCommunities.length > 0,
        communitiesCount: fallbackCommunities.length
      });
    }
  } catch (error: any) {
    console.error("Error in sync organization API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
