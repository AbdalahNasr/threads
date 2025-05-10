import { Suspense } from "react";
import {
  fetchCommunities,
  getUserCommunities,
} from "@/lib/actions/community.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import CommunityCard from "@/components/cards/CommunityCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { Community } from "@/lib/types/community.types";

// Import clerk-sync actions only if it exists, otherwise provide a fallback
let fullClerkSync: (userId: string) => Promise<any>;
try {
  const syncModule = require("@/lib/actions/clerk-sync.actions");
  fullClerkSync = syncModule.fullClerkSync;
} catch (error) {
  // Provide a fallback if the module doesn't exist
  fullClerkSync = async (userId: string) => ({
    success: false,
    error: "Sync functionality not available",
  });
}

export const metadata: Metadata = {
  title: "Communities | Threads",
  description: "Discover and join communities on Threads.",
};

interface CommunitiesPageProps {
  searchParams: {
    q?: string;
    page?: string;
    refresh?: string;
    sync?: string;
  };
}

// Make sure this isn't cached too aggressively
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  // Verify if user is onboarded
  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) return redirect("/onboarding");

  const q = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const pageSize = 12;
  const forceRefresh = searchParams.refresh === "true";
  const forceSync = searchParams.sync === "true";

  // Add cache-busting timestamp to ensure fresh data
  const timestamp = Date.now();

  // If sync is requested, perform a full Clerk sync first
  let syncMessage: string | null = null;
  if (forceSync && typeof fullClerkSync === "function") {
    try {
      const syncResult = await fullClerkSync(user.id);
      syncMessage = syncResult.message || "Sync completed";

      if (!syncResult.success) {
        console.error("Sync failed:", syncResult.error);
        syncMessage = `Sync error: ${syncResult.error}`;
      }
    } catch (error: any) {
      console.error("Error during sync:", error);
      syncMessage = `Sync error: ${error.message}`;
    }
  }

  // Get user's joined communities
  let userCommunities: Community[] = [];
  try {
    userCommunities = await getUserCommunities(user.id);
  } catch (error) {
    console.error("Error fetching user communities:", error);
    // Continue with empty array
  }

  // Extract community IDs for filtering
  const userCommunityIds = userCommunities.map((comm) => comm.id || comm._id);

  // Fetch all communities data
  const communitiesResult = await fetchCommunities({
    searchString: q,
    pageNumber: page,
    pageSize,
    userId: user.id,
    skipCache: forceRefresh || forceSync,
    _cache: timestamp, // Add timestamp to bust cache
  });

  // Type-safe access to communities array
  const allCommunities = communitiesResult.communities || [];
  const hasNextPage = communitiesResult.isNext || false;

  // Filter communities the user hasn't joined yet
  const discoveredCommunities = allCommunities.filter(
    (community) => !userCommunityIds.includes(community.id || community._id)
  );

  return (
    <section className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-heading2-bold text-light-1">Communities</h1>
        <div className="flex gap-2">
          {typeof fullClerkSync === "function" && (
            <Link
              href={`/communities?sync=true&t=${timestamp}`}
              prefetch={false}
            >
              <Button variant="outline" className="mr-2">
                Sync
              </Button>
            </Link>
          )}
          <Link
            href={`/communities?refresh=true&t=${timestamp}`}
            prefetch={false}
          >
            <Button variant="outline" className="mr-2">
              Refresh
            </Button>
          </Link>
          <Link href="/create-organization">
            <Button className="bg-primary-500 hover:bg-primary-600">
              Create Community
            </Button>
          </Link>
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className="bg-dark-3 p-4 rounded-lg text-light-2">
          {syncMessage}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-2">
        <form className="flex-1 relative">
          <input
            type="text"
            name="q"
            placeholder="Search communities..."
            defaultValue={q}
            className="search-input peer w-full bg-dark-3 p-4 pl-14 pr-4 rounded-lg outline-none border-none text-light-1"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </form>
      </div>

      {/* Your Communities Section */}
      <div>
        <h2 className="text-heading4-medium text-light-1 mb-4">
          Your Communities
        </h2>
        {userCommunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCommunities.map((community) => (
              <CommunityCard
                key={
                  community.id || community._id || `user-comm-${Math.random()}`
                }
                community={community}
              />
            ))}
          </div>
        ) : (
          <div className="text-light-3 text-center py-6 bg-dark-3 rounded-lg">
            You haven't joined any communities yet.
            <Link href="/create-organization" className="text-primary-500 ml-1">
              Create one
            </Link>{" "}
            or discover communities below.
          </div>
        )}
      </div>

      {/* Discover Communities Section */}
      <div>
        <h2 className="text-heading4-medium text-light-1 mb-4">
          Discover Communities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {!discoveredCommunities.length ? (
            <div className="text-light-3 text-center col-span-full py-6 bg-dark-3 rounded-lg">
              {q
                ? "No communities found matching your search."
                : allCommunities.length > 0
                ? "You've joined all available communities. Create a new one!"
                : "No communities found. Be the first to create one!"}
            </div>
          ) : (
            discoveredCommunities.map((community) => (
              <CommunityCard
                key={
                  community.id ||
                  community._id ||
                  `discover-comm-${Math.random()}`
                }
                community={community}
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {hasNextPage && discoveredCommunities.length > 0 && (
        <div className="flex justify-center mt-6">
          <Link
            href={{
              pathname: "/communities",
              query: {
                ...(q ? { q } : {}),
                page: page + 1,
              },
            }}
          >
            <Button variant="outline" className="text-light-2">
              Load More
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}

export default function Communities({
  searchParams,
}: CommunitiesPageProps) {
  return (
    <Suspense
      fallback={<div className="text-light-1">Loading communities...</div>}
    >
      <CommunitiesPage searchParams={searchParams} />
    </Suspense>
  );
}