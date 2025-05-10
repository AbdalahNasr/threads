import { getCommunity, joinCommunity } from "../lib/actions/community.actions";

// In your component:
const handleJoinCommunity = async () => {
  const result = await joinCommunity(communityId, userId);
  if (result) {
    // Handle successful join
    toast.success("Successfully joined the community!");
  }
  // Error cases are handled within the action
};

// For fetching community:
const loadCommunity = async () => {
  const community = await getCommunity(communityId);
  if (community) {
    // Update your component state with the community data
    setCommunity(community);
  }
  // Error cases are handled within the action
};
