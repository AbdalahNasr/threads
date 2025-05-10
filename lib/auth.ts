
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Helper function to get the current authenticated user ID
 * and redirect to sign-in if not authenticated
 */
export function getAuthUserId(): string {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
    // This line won't execute due to the redirect, but TypeScript wants a return
    throw new Error("User not authenticated");
  }
  
  return userId;
}

/**
 * Check if a user is authenticated without redirecting
 */
export function isAuthenticated(): boolean {
  const { userId } = auth();
  return !!userId;
}

/**
 * Get the authenticated user ID if available, or null if not authenticated
 */
export function getOptionalAuthUserId(): string | null {
  const { userId } = auth();
  return userId;
}