import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { fetchCommunityByClerkId, addMemberToCommunity } from "@/lib/actions/community.actions";
import { fetchUser } from "@/lib/actions/user.actions";

async function JoinCommunityPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  // Verify if user is onboarded
  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) return redirect("/onboarding");

  const communityId = params.id;
  const community = await fetchCommunityByClerkId(communityId);

  if (!community) {
    return redirect("/communities");
  }

  // Check if user is already a member
  const isUserMember = community.members.some((member: any) => {
    if (typeof member === 'string') {
      return member === userInfo._id;
    } else {
      return member.id === user.id || member._id === userInfo._id;
    }
  });

  if (isUserMember) {
    // User is already a member, redirect to community page
    return redirect(`/communities/${communityId}`);
  }

  // Join the community
  await addMemberToCommunity(communityId, user.id);

  // Redirect to the community page
  return redirect(`/communities/${communityId}`);
}

export default JoinCommunityPage;