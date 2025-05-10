import { redirect } from "next/navigation";
import { fetchCommunityDetails } from "@/lib/actions/community.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import CommunityJoinButton from "@/components/shared/CommunityJoinButton";
import ProfileHeader from "@/components/shared/PrrofileHeader";
import ThreadsTab from "@/components/shared/ThreadsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

interface CommunityPageProps {
  params: {
    id: string;
  };
}

async function CommunityPage({ params }: CommunityPageProps) {
  // Use auth() instead of currentUser()
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
    return null;
  }

  const userInfo = await fetchUser(userId);
  if (!userInfo?.onboarded) redirect("/onboarding");

  try {
    const communityDetails = await fetchCommunityDetails(params.id);
    
    if (!communityDetails) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-white">Community not found</h1>
          <p className="text-light-2">The community you're looking for doesn't exist or has been removed.</p>
        </div>
      );
    }

    // Ensure we have a username
    const communityUsername = communityDetails.username || 
      (communityDetails.name ? communityDetails.name.toLowerCase().replace(/\s+/g, '-') : '');

    // Check if user is a member of the community
    const isMember = communityDetails.members.some(
      (member: any) => member.id === userInfo.id
    );

    return (
      <section className="community-page">
        <ProfileHeader
          accountId={communityDetails._id}
          authUserId={userInfo.id}
          name={communityDetails.name}
          username={communityUsername}
          imgUrl={communityDetails.image}
          bio={communityDetails.bio}
          type="Community"
        />

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/members.svg"
                alt="members"
                width={18}
                height={18}
                className="object-contain"
              />
              <p className="text-small-medium text-light-2">
                {communityDetails.members.length} members
              </p>
            </div>
          </div>
          
          <CommunityJoinButton 
            communityId={communityDetails._id}
            isMember={isMember}
            userId={userInfo.id}
          />
        </div>

        <div className="mt-9">
          <Tabs defaultValue="threads" className="w-full">
            <TabsList className="tab">
              <TabsTrigger value="threads" className="tab">
                Threads
              </TabsTrigger>
              <TabsTrigger value="members" className="tab">
                Members
              </TabsTrigger>
              <TabsTrigger value="requests" className="tab">
                Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="threads">
              <ThreadsTab
                currentUserId={userInfo._id}
                accountId={communityDetails._id}
                accountType="Community"
              />
            </TabsContent>
            
            <TabsContent value="members" className="mt-9 w-full">
              <div className="flex flex-col gap-5">
                {communityDetails.members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-4">
                    <Image
                      src={member.image || "/assets/user.svg"}
                      alt={member.name || "Member"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <h3 className="text-base-semibold text-light-1">{member.name || "Anonymous"}</h3>
                      <p className="text-small-medium text-gray-1">@{member.username || "user"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="requests" className="mt-9 w-full">
              <p className="text-base-regular text-light-2">No pending requests</p>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Error loading community:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="text-light-2">We couldn't load the community information. Please try again later.</p>
      </div>
    );
  }
}

export default CommunityPage;