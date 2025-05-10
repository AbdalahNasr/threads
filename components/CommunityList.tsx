"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import CommunityCard from "./cards/CommunityCard";
import { fetchCommunities } from "@/lib/actions/community.actions";
import { Community } from "@/lib/types/community.types";

export default function CommunityList() {
  const router = useRouter();
  const pathname = usePathname(); // Use pathname instead of router events
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch and refresh data
  const refreshCommunities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching communities...");
      
      // Use a cache-busting query parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const result = await fetchCommunities({
        searchString: "",
        pageNumber: 1,
        pageSize: 50,
        skipCache: true,
        _cache: timestamp, // This will be ignored by the server but forces a fresh request
      });
      
      console.log("Fetched communities result:", result);
      
      if (!result || !result.communities || !Array.isArray(result.communities)) {
        console.error("Invalid communities data returned:", result);
        setError("Invalid data returned from server");
        setCommunities([]);
        return;
      }
      
      // Process and normalize the community data
      const processedCommunities = result.communities
        .filter(community => community && typeof community === 'object')
        .map(community => {
          // Create a normalized community object with required fields
          const processed = {
            ...community,
            _id: community._id || community.id || `community-${Math.random()}`,
            id: community.id || community._id || `id-${Math.random()}`,
            name: community.name || 'Unnamed Community',
            members: Array.isArray(community.members) ? community.members : []
          };
          console.log("Processed community:", processed);
          return processed;
        });
      
      console.log(`Processed ${processedCommunities.length} communities`);
      setCommunities(processedCommunities);
    } catch (err: any) {
      console.error("Error fetching communities:", err);
      setError(err.message || "Failed to load communities");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    refreshCommunities();

    // Set up interval to refresh data periodically (every 30 seconds)
    const intervalId = setInterval(refreshCommunities, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Listen for pathname changes to refresh data
  useEffect(() => {
    // This will run when the pathname changes
    refreshCommunities();
  }, [pathname]); // This replaces the router.events approach

  if (isLoading && communities.length === 0) {
    return <div className="p-4">Loading communities...</div>;
  }

  if (error && communities.length === 0) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
        <button
          onClick={refreshCommunities}
          className="ml-2 px-3 py-1 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Communities</h2>
        <button
          onClick={refreshCommunities}
          className="px-3 py-1 bg-blue-500 text-white rounded flex items-center"
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {communities.length === 0 ? (
        <div className="p-4 text-gray-500">No communities found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community, index) => {
            console.log(`Rendering community ${index}:`, community);
            return (
              <div key={community._id || `community-${index}`}>
                {/* Explicit check to ensure we're passing a valid community */}
                {community && typeof community === 'object' ? (
                  <CommunityCard community={community} />
                ) : (
                  <div className="border rounded-lg p-4 bg-red-50">
                    <p className="text-red-500">Invalid community data at index {index}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
