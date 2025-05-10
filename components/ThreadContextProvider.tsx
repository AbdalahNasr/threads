"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from "react";
import { createThread, fetchPosts } from "@/lib/actions/thread.action";

// Define the types for our thread state
type Thread = {
  _id: string;
  text: string;
  author: {
    _id: string;
    name: string;
    image: string;
  };
  community?: {
    _id: string;
    name: string;
    image: string;
  } | null;
  createdAt: string;
  parentId?: string | null;
  children: any[];
  likes: string[];
  reposts: string[];
  image?: string;
};

type ThreadContextType = {
  threads: Thread[];
  isLoading: boolean;
  error: string | null;
  fetchThreads: (pageNumber?: number, pageSize?: number) => Promise<void>;
  addThread: (threadData: any) => Promise<any>;
  likeThread: (threadId: string, userId: string) => Promise<void>;
  repostThread: (threadId: string, userId: string) => Promise<void>;
  clearThreads: () => void;
};

// Create the context with default values
const ThreadContext = createContext<ThreadContextType>({
  threads: [],
  isLoading: false,
  error: null,
  fetchThreads: async () => {},
  addThread: async () => null,
  likeThread: async () => {},
  repostThread: async () => {},
  clearThreads: () => {},
});

// Hook to use the thread context
export const useThreads = () => useContext(ThreadContext);

interface ThreadContextProviderProps {
  children: ReactNode;
}

/**
 * Thread Context Provider
 *
 * Manages the global state of threads and provides functions
 * to interact with threads (create, like, repost, etc.)
 */
export function ThreadContextProvider({
  children,
}: ThreadContextProviderProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch threads from the server
  const fetchThreads = useCallback(async (pageNumber = 1, pageSize = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchPosts(pageNumber, pageSize);

      if (response && response.posts) {
        // Replace threads if it's the first page, otherwise append
        if (pageNumber === 1) {
          setThreads(response.posts);
        } else {
          setThreads((prev) => [...prev, ...response.posts]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching threads:", err);
      setError(err.message || "Failed to load threads");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new thread with optimistic update
  const addThread = useCallback(async (threadData: any) => {
    setError(null);

    try {
      // Create optimistic thread for immediate UI update
      const optimisticThread = {
        _id: `temp-${Date.now()}`,
        text: threadData.text,
        author: {
          _id: threadData.author,
          name: "You", // This will be replaced with actual data
          image: "", // This will be replaced with actual data
        },
        community: threadData.communityId
          ? {
              _id: threadData.communityId,
              name: "Your Community",
              image: "",
            }
          : null,
        createdAt: new Date().toISOString(),
        children: [],
        likes: [],
        reposts: [],
        image: threadData.image || "",
        isOptimistic: true, // Flag to identify this is an optimistic update
      };

      // Add optimistic thread to state for immediate feedback
      setThreads((prev) => [optimisticThread, ...prev]);

      // Actually create the thread on the server
      const createdThread = await createThread(threadData);

      // Replace optimistic thread with the real one
      setThreads((prev) =>
        prev.map((thread) =>
          thread._id === optimisticThread._id
            ? { ...createdThread, isOptimistic: false }
            : thread
        )
      );

      return createdThread;
    } catch (err: any) {
      console.error("Error creating thread:", err);

      // Remove the optimistic thread on error
      setThreads((prev) =>
        prev.filter((thread) => thread._id !== `temp-${Date.now()}`)
      );

      setError(err.message || "Failed to create thread");
      throw err; // Re-throw to handle in the component
    }
  }, []);

  // Like a thread with optimistic update
  const likeThread = useCallback(
    async (threadId: string, userId: string) => {
      try {
        // Find the thread to update
        const threadToUpdate = threads.find((t) => t._id === threadId);
        if (!threadToUpdate) return;

        // Check if user already liked the thread
        const isLiked = threadToUpdate.likes.includes(userId);

        // Update the thread optimistically
        setThreads((prev) =>
          prev.map((thread) => {
            if (thread._id === threadId) {
              return {
                ...thread,
                likes: isLiked
                  ? thread.likes.filter((id) => id !== userId)
                  : [...thread.likes, userId],
              };
            }
            return thread;
          })
        );

        // Make the actual API call (you'll need to implement this function)
        // The actual API call to like/unlike the thread
        // await likeThreadAction(threadId, userId);
      } catch (err: any) {
        console.error("Error liking thread:", err);
        setError(err.message || "Failed to like thread");

        // Revert the optimistic update on error
        fetchThreads();
      }
    },
    [threads, fetchThreads]
  );

  // Repost a thread with optimistic update
  const repostThread = useCallback(
    async (threadId: string, userId: string) => {
      try {
        // Find the thread to update
        const threadToUpdate = threads.find((t) => t._id === threadId);
        if (!threadToUpdate) return;

        // Check if user already reposted the thread
        const isReposted = threadToUpdate.reposts.includes(userId);

        // Update the thread optimistically
        setThreads((prev) =>
          prev.map((thread) => {
            if (thread._id === threadId) {
              return {
                ...thread,
                reposts: isReposted
                  ? thread.reposts.filter((id) => id !== userId)
                  : [...thread.reposts, userId],
              };
            }
            return thread;
          })
        );

        // Make the actual API call (you'll need to implement this function)
        // await repostThreadAction(threadId, userId);
      } catch (err: any) {
        console.error("Error reposting thread:", err);
        setError(err.message || "Failed to repost thread");

        // Revert the optimistic update on error
        fetchThreads();
      }
    },
    [threads, fetchThreads]
  );

  // Clear all threads
  const clearThreads = useCallback(() => {
    setThreads([]);
  }, []);

  // Create the context value
  const contextValue: ThreadContextType = {
    threads,
    isLoading,
    error,
    fetchThreads,
    addThread,
    likeThread,
    repostThread,
    clearThreads,
  };

  // Provide the thread context to children
  return (
    <ThreadContext.Provider value={contextValue}>
      {children}
    </ThreadContext.Provider>
  );
}
