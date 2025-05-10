import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";
import { fetchThreadById } from "@/lib/actions/thread.action";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;
  const userInfo = await fetchUser(user.id);
  if (!userInfo.onboarded) redirect("/onboarding");

  const thread = await fetchThreadById(params.id);

  return (
    <section className="relative">
      <div>
        <ThreadCard
          key={thread?._id}
          id={thread?._id}
          currentUserId={user.id || ""}
          parentId={thread?._id}
          content={thread?.text}
          author={thread?.author}
          community={thread?.community}
          createdAt={thread?.createdAt}
          comments={thread?.children}
          likes={thread?.likes?.map((like: any) => like.toString()) || []}
          reposts={
            thread?.reposts?.map((repost: any) => repost.toString()) || []
          }
        />
      </div>
      <div className="mt-7">
        <Comment
          threadId={thread.id}
          currentUserImg={userInfo.image}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>
      <div className="mt-7">
        {thread.children.map((childItem: any) => (
          <ThreadCard
            key={childItem?._id}
            id={childItem?._id}
            currentUserId={childItem?.id || ""}
            parentId={childItem?._id}
            content={childItem?.text}
            author={childItem?.author}
            community={childItem?.community}
            createdAt={childItem?.createdAt}
            comments={childItem?.children}
            isComment
            likes={childItem?.likes?.map((like: any) => like.toString()) || []}
            reposts={
              childItem?.reposts?.map((repost: any) => repost.toString()) || []
            }
          />
        ))}
      </div>
    </section>
  );
};

export default Page;
