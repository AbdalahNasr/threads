import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";

/**
 * API endpoint to force refresh cached data
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

    const body = await req.json();
    const { path, tag } = body;

    // Require at least a path or a tag to revalidate
    if (!path && !tag) {
      return NextResponse.json(
        { error: "Either path or tag must be provided" },
        { status: 400 }
      );
    }

    // Revalidate the path if provided
    if (path) {
      revalidatePath(path);
    }

    // Revalidate the tag if provided
    if (tag) {
      revalidateTag(tag);
    }

    return NextResponse.json({
      success: true,
      message: `Cache refreshed for ${path ? `path: ${path}` : ''}${path && tag ? ' and ' : ''}${tag ? `tag: ${tag}` : ''}`,
    });
  } catch (error: any) {
    console.error("Error refreshing cache:", error);
    return NextResponse.json(
      { error: "Failed to refresh cache", message: error.message },
      { status: 500 }
    );
  }
}