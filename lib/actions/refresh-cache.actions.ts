"use server";

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Type definition for refresh cache options
 */
export interface RefreshCacheOptions {
  path?: string;
  tag?: string;
}

type RefreshCacheResult = {
  success: boolean;
  message: string;
};

/**
 * Server action to refresh community cache
 * @param options String path or object containing path and/or tag to revalidate
 */
export async function refreshCommunityCache(
  options: RefreshCacheOptions | string = "/communities"
): Promise<RefreshCacheResult> {
  try {
    // Handle if options is a string (for backward compatibility)
    let path: string | undefined;
    let tag: string | undefined;

    if (typeof options === 'string') {
      path = options;
    } else {
      path = options.path;
      tag = options.tag;
    }

    // Default path if none provided
    if (!path && !tag) {
      path = "/communities";
    }
    
    // Add debug logging
    console.log(`Refreshing cache for path: ${path}, tag: ${tag}`);
    
    if (path) {
      revalidatePath(path);
    }
    
    if (tag) {
      revalidateTag(tag);
    }
    
    return {
      success: true,
      message: `Cache refreshed for ${path ? `path: ${path}` : ''}${path && tag ? ' and ' : ''}${tag ? `tag: ${tag}` : ''}`
    };
  } catch (error: any) {
    console.error("Error refreshing cache:", error);
    return {
      success: false,
      message: error.message || "Failed to refresh cache"
    };
  }
}
