/**
 * Interface representing a Community document in the database
 */
export interface Community {
  _id: string;
  id: string;
  clerkId?: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
  createdBy?: string;
  members: {
    _id: string;
    id: string;
    name: string;
    username?: string;
    image?: string;
  }[];
  threads?: string[] | any[];
  isPrivate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isUserMember?: boolean; // Added to track user membership status
}

/**
 * Interface for the response from fetchCommunities function
 */
export interface CommunitiesResponse {
  communities: Community[];
  isNext: boolean;
  totalCommunitiesCount?: number;
}

/**
 * Interface for parameters when creating a community
 */
export interface CommunityCreationParams {
  name: string;
  username?: string;
  bio?: string;
  image?: string;
  isPrivate?: boolean;
  creatorId: string;
  clerkId?: string;
}

/**
 * Interface for parameters when updating a community
 */
export interface CommunityUpdateParams {
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
  isPrivate?: boolean;
}

/**
 * Interface for community member
 */
export interface CommunityMember {
  _id: string;
  id: string;
  name: string;
  username?: string;
  image?: string;
}

/**
 * Interface for the result of community operations like adding/removing members
 */
export interface CommunityOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  community?: Community;
  debug?: string; // Added debug property for diagnostic information
}

/**
 * Interface for fetchCommunities parameters
 */
export interface FetchCommunitiesParams {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  skipCache?: boolean;
  /**
   * The Clerk user ID to check membership status
   * Used to determine if the user is a member of communities
   */
  userId?: string;
  _cache?: number; // For cache-busting timestamps
}