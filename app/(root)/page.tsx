import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import ThreadCard from "@/components/cards/ThreadCard";
import CommunityCard from "@/components/cards/CommunityCard";
import Pagination from "@/components/shared/Pagination";

import { fetchPosts } from "@/lib/actions/thread.action";
import { fetchUser } from "@/lib/actions/user.actions";
import { fetchSuggestedCommunities } from "@/lib/actions/community.actions";

// Define Community interface
interface Community {
  _id: string;
  id?: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
  members: any[];
}

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { userId } = auth();

  if (!userId) return redirect("/sign-in");

  const user = await fetchUser(userId);
  if (!user?.onboarded) redirect("/onboarding");

  // Fetch posts
  const postsResult = await fetchPosts(
    searchParams.page ? +searchParams.page : 1,
    30
  );

  // Fetch communities with error handling
  let suggestedCommunities: Community[] = [];
  try {
    suggestedCommunities = await fetchSuggestedCommunities(user.id, 3);
  } catch (error) {
    console.error("Error fetching suggested communities:", error);
    // Continue with empty suggestions
  }

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <section className="mt-9 flex flex-col gap-10">
        {postsResult.posts.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {postsResult.posts.map((post) => (
              <ThreadCard
                key={post._id}
                id={post._id}
                currentUserId={user.id}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
            ))}
          </>
        )}
      </section>

      <Pagination
        path="/"
        pageNumber={searchParams?.page ? +searchParams.page : 1}
        isNext={postsResult.isNext}
      />

      <section className="mt-9">
        <h2 className="text-heading4-medium text-light-1">
          Suggested Communities
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {suggestedCommunities.length === 0 ? (
            <p className="no-result">No suggested communities</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedCommunities.map((community: Community) => (
                <CommunityCard
                  key={community._id}
                  id={community._id}
                  name={community.name}
                  username={community.username}
                  imgUrl={community.image}
                  bio={community.bio}
                  members={community.members || []}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
