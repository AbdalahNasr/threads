"use server";

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Community from "../models/community.model";
import mongoose from "mongoose";

interface Params {
  text: string;
  author: string;
  communityId?: string | null;
  image?: string;
  path: string;
}

// Define the thread data interface with all possible properties
interface ThreadData {
  text: string;
  author: mongoose.Types.ObjectId;
  image?: string;
  parentId: null | mongoose.Types.ObjectId;
  children: mongoose.Types.ObjectId[];
  community?: mongoose.Types.ObjectId; // Add optional community property
}

interface CreateThreadParams {
  text: string;
  userId: string;
  communityId?: mongoose.Types.ObjectId | null;
}

/**
 * Creates a new thread post
 */
export async function createThread(params: CreateThreadParams) {
  try {
    const startTime = performance.now();
    
    // Connect to DB
    await connectToDB();

    console.log(`Attempting to find user with id: ${params.userId}`);

    // Find user with more detailed error handling
    const user = await User.findOne({ id: params.userId });
    
    if (!user) {
      // Log all users for debugging
      const allUsers = await User.find({}, 'id name');
      console.log('Available users in DB:', allUsers);
      
      throw new Error(`User not found with id: ${params.userId}`);
    }

    console.log(`Found user:`, {
      userId: user.id,
      _id: user._id,
      name: user.name
    });

    // Create thread with all required fields
    const threadData = {
      text: params.text,
      author: user._id,
      parentId: null,
      children: [],
      createdAt: new Date(),
      community: params.communityId || null
    };

    console.log('Creating thread with data:', threadData);

    const createdThread = await Thread.create(threadData);

    // Update user's threads array with error handling
    const updateResult = await User.findByIdAndUpdate(
      user._id,
      { $push: { threads: createdThread._id } },
      { new: true }
    );

    if (!updateResult) {
      throw new Error('Failed to update user with new thread');
    }

    const endTime = performance.now();
    console.log({
      operation: 'Thread creation complete',
      timeTaken: `${(endTime - startTime).toFixed(2)}ms`,
      threadId: createdThread._id
    });

    revalidatePath('/');
    return {
      success: true,
      thread: createdThread
    };
    
  } catch (error: any) {
    console.error('Error creating thread:', {
      error: error.message,
      userId: params.userId,
      stack: error.stack
    });
    
    return {
      success: false,
      error: `Failed to create thread: ${error.message}`
    };
  }
}

/**
 * Fetch posts for the home feed (newest threads)
 * @param pageNumber Page number to fetch
 * @param pageSize Number of posts per page
 * @returns Object with threads and pagination info
 */
export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  try {
    await connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "community",
        model: Community,
      })
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id id name parentId image",
        },
      });

    const totalPostsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const posts = await postsQuery.exec();

    // Convert MongoDB documents to plain objects and stringify ObjectIds
    const serializedPosts = posts.map((post) => ({
      ...post.toJSON(),
      _id: post._id.toString(),
      author: {
        ...post.author.toJSON(),
        _id: post.author._id.toString(),
      },
      community: post.community
        ? {
            ...post.community.toJSON(),
            _id: post.community._id.toString(),
          }
        : null,
      children: post.children.map((child: any) => ({
        ...child.toJSON(),
        _id: child._id.toString(),
        author: {
          ...child.author.toJSON(),
          _id: child.author._id.toString(),
        },
      })),
      likes: post.likes?.map((like: any) => like.toString()) || [],
      reposts: post.reposts?.map((repost: any) => repost.toString()) || [],
    }));

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts: serializedPosts, isNext };
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }
}

/**
 * Fetch a thread by its ID
 * @param threadId The ID of the thread to fetch
 * @returns The thread with populated author, community and children
 */
export async function fetchThreadById(threadId: string) {
  try {
    await connectToDB();

    // Find thread by ID
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec();

    return thread;
  } catch (error: any) {
    console.error("Error fetching thread:", error);
    throw new Error(`Failed to fetch thread: ${error.message}`);
  }
}

export async function likeThread(threadId: string, userId: string, path: string) {
  try {
    await connectToDB();

    const thread = await Thread.findById(threadId);
    if (!thread) throw new Error("Thread not found");

    const user = await User.findOne({ id: userId });
    if (!user) throw new Error("User not found");

    const isLiked = thread.likes.includes(user._id);

    if (isLiked) {
      thread.likes = thread.likes.filter((id: any) => id.toString() !== user._id.toString());
    } else {
      thread.likes.push(user._id);
    }

    await thread.save();
    revalidatePath(path);

    return { success: true, isLiked: !isLiked };
  } catch (error: any) {
    console.error("Error liking thread:", error);
    return { success: false, error: error.message };
  }
}

export async function repostThread(threadId: string, userId: string, path: string) {
  try {
    await connectToDB();

    const thread = await Thread.findById(threadId);
    if (!thread) throw new Error("Thread not found");

    const user = await User.findOne({ id: userId });
    if (!user) throw new Error("User not found");

    const isReposted = thread.reposts.includes(user._id);

    if (isReposted) {
      // Remove repost
      thread.reposts = thread.reposts.filter((id: any) => id.toString() !== user._id.toString());
    } else {
      // Add repost
      thread.reposts.push(user._id);
    }

    await thread.save();
    revalidatePath(path);

    return { success: true, isReposted: !isReposted };
  } catch (error: any) {
    throw new Error(`Failed to repost thread: ${error.message}`);
  }
}

export async function shareThread(threadId: string) {
  try {
    await connectToDB();
    const thread = await Thread.findById(threadId);
    if (!thread) throw new Error("Thread not found");

    // Return the thread URL for sharing
    return { success: true, url: `/thread/${threadId}` };
  } catch (error: any) {
    throw new Error(`Failed to share thread: ${error.message}`);
  }
}

/**
 * Verify if a user exists in the database
 * @param userId The ID of the user to verify
 * @returns Boolean indicating whether the user exists
 */
async function verifyUserExists(userId: string) {
  const user = await User.findOne({ id: userId });
  if (!user) {
    const allUsers = await User.find({}, 'id name');
    console.log('All users:', allUsers);
    console.log('Searching for userId:', userId);
    return false;
  }
  return true;
}

// Add any other thread-related functions here
// For example, fetching threads by community, updating threads, etc.
//   return { success: true, communityId: newCommunity._id };
//   } catch (error: any) {
//     console.error("Error creating community from organization:", error);
//     return { success: false, error: error.message };
//   }