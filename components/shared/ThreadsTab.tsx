"use client";

import { fetchUserPost } from "@/lib/actions/user.actions";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import ThreadCard from "@/components/cards/ThreadCard";
import { useEffect, useState } from "react";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const ThreadsTab = ({ currentUserId, accountId, accountType }: Props) => {
  const [threads, setThreads] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchThreads = async () => {
      if (!mounted) return;

      setIsLoading(true);
      setError(null);

      try {
        let result;

        if (accountType === "Community") {
          result = await fetchCommunityPosts(accountId);
          setThreads(result || []);
        } else {
          result = await fetchUserPost(accountId);
          if (result) {
            setUserData(result);
            setThreads(result.threads || []);
          }
        }
      } catch (error) {
        console.error("Error fetching threads:", error);
        setError("Failed to load threads. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted && accountId) {
      fetchThreads();
    }
  }, [accountId, accountType, mounted]);

  if (!mounted) return null;

  if (isLoading) {
    return <div className="text-light-3">Loading threads...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (threads.length === 0) {
    return <p className="no-result">No threads found</p>;
  }

  return (
    <section className="mt-9 flex flex-col gap-10">
      {threads.map((thread: any) => (
        <ThreadCard
          key={thread._id}
          id={thread._id}
          currentUserId={currentUserId}
          parentId={thread.parentId}
          content={thread.text}
          author={accountType === "User" ? userData : thread.author}
          community={thread.community}
          createdAt={thread.createdAt}
          comments={thread.children}
          likes={thread.likes?.map((like: any) => like.toString()) || []}
          reposts={thread.reposts?.map((repost: any) => repost.toString()) || []}
        />
      ))}
    </section>
  );
};

export default ThreadsTab;
