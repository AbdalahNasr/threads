"use client";

import { useEffect, useState } from 'react';
import ThreadCard from './cards/ThreadCard';
import { Loader2 } from 'lucide-react'; // Import loading spinner

interface ThreadListProps {
  initialPosts: any[];
}

export const ThreadList = ({ initialPosts }: ThreadListProps) => {
  const [posts, setPosts] = useState(initialPosts);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updatePosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const startTime = performance.now();
        
        setPosts(initialPosts);
        
        const endTime = performance.now();
        setLastUpdateTime(endTime - startTime);
      } catch (err) {
        setError('Failed to load posts. Please try again.');
        console.error('Error updating posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    updatePosts();
  }, [initialPosts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lastUpdateTime && (
        <div className="text-sm text-gray-500">
          State update took: {lastUpdateTime.toFixed(2)}ms
        </div>
      )}
      {posts.length === 0 ? (
        <p className="text-center text-gray-500">No posts available.</p>
      ) : (
        posts.map((post) => (
          <ThreadCard 
            key={post._id}
            id={post._id}
            currentUserId={post.author.id}
            parentId={post.parentId}
            content={post.text}
            author={post.author}
            community={post.community}
            createdAt={post.createdAt}
            comments={post.children}
            isComment={false}
          />
        ))
      )}
    </div>
  );
};