"use client";

import { useOrganization } from "@clerk/nextjs";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { fetchCommunityByClerkId } from "@/lib/actions/community.actions";

// Define the organization context type
type OrganizationContextType = {
  isLoaded: boolean;
  isActive: boolean;
  organization: any | null;
  membershipRole: string | null;
  community: any | null;
  communityLoading: boolean;
  communityError: Error | null;
};

// Create the context with default values
const OrganizationContext = createContext<OrganizationContextType>({
  isLoaded: false,
  isActive: false,
  organization: null,
  membershipRole: null,
  community: null,
  communityLoading: true,
  communityError: null,
});

// Hook to use the organization context
export const useOrganizationContext = () => useContext(OrganizationContext);

interface OrganizationContextProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Organization Context Provider
 *
 * A wrapper component that provides organization context to its children
 * and handles cases where an organization is not active.
 * Also fetches community data associated with the organization.
 */
export function OrganizationContextProvider({
  children,
  fallback,
}: OrganizationContextProviderProps) {
  // Use Clerk's useOrganization hook
  const orgData = useOrganization();
  const { organization, isLoaded, membership } = orgData;

  // State for community data
  const [community, setCommunity] = useState<any | null>(null);
  const [communityLoading, setCommunityLoading] = useState<boolean>(true);
  const [communityError, setCommunityError] = useState<Error | null>(null);

  // Extract membership role from the membership object
  const membershipRole = membership?.role || null;

  // Fetch community data when organization changes
  useEffect(() => {
    const fetchCommunity = async () => {
      if (!isLoaded) return;

      try {
        setCommunityLoading(true);
        
        // Only fetch if we have an organization
        if (organization) {
          const communityData = await fetchCommunityByClerkId(organization.id);
          setCommunity(communityData);
        } else {
          setCommunity(null);
        }
        
        setCommunityError(null);
      } catch (err) {
        console.error('Error fetching community:', err);
        setCommunityError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setCommunity(null);
      } finally {
        setCommunityLoading(false);
      }
    };

    fetchCommunity();
  }, [organization, isLoaded]);

  // Create the context value
  const contextValue: OrganizationContextType = {
    isLoaded,
    isActive: !!organization,
    organization,
    membershipRole,
    community,
    communityLoading,
    communityError,
  };

  // If not loaded yet, show a loading state
  if (!isLoaded) {
    return <div className="animate-pulse">Loading organization data...</div>;
  }

  // If no organization is active and a fallback is provided, render the fallback
  if (!organization && fallback) {
    return <>{fallback}</>;
  }

  // Provide the organization context to children
  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}
