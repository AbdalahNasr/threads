"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCommunities } from "@/lib/actions/community.actions";
import { Community, CommunitiesResponse } from "@/lib/types/community.types";

interface UseCommunityParams {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseCommunityResult {
  communities: Community[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  totalCount: number;
}

/**
 * Custom hook for fetching and managing communities data
 */
export function useCommunities({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: UseCommunityParams = {}): UseCommunityResult {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Function to fetch communities data
  const fetchData = useCallback(async (page = currentPage, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Force cache bypass by adding timestamp
      const result = await fetchCommunities({
        searchString,
        pageNumber: page,
        pageSize,
        skipCache: true,
      });
      
      // Update state based on whether we're appending or replacing
      if (append) {
        setCommunities(prev => [...prev, ...result.communities]);
      } else {
        setCommunities(result.communities);
      }
      
      setHasMore(result.isNext);
      setTotalCount(result.totalCommunitiesCount || 0);
    } catch (err: any) {
      console.error("Error fetching communities:", err);
      setError(err.message || "Failed to load communities");
    } finally {
      setIsLoading(false);
    }
  }, [searchString, pageSize, currentPage]);

  // Function to refresh data
  const refresh = useCallback(async () => {
    // Reset to first page and reload
    setCurrentPage(1);
    await fetchData(1, false);
  }, [fetchData]);

  // Function to load more data
  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchData(nextPage, true);
    }
  }, [isLoading, hasMore, currentPage, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(refresh, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refresh, refreshInterval]);

  return {
    communities,
    isLoading,
    error,
    refresh,
    hasMore,
    loadMore,
    totalCount
  };
}