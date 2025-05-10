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

/**
 * Creates a new thread post
 */
export async function createThread({ 
  text, 
  author, 
  communityId, 
  image = "", 
  path 
}: Params) {
  try {
    connectToDB();

    // Find the author in the database
    const userObjectId = await User.findOne({ id: author }, { _id: 1 });

    if (!userObjectId) {
      throw new Error("User not found");
    }

    // Prepare new thread data with proper typing
    const threadData: ThreadData = {
      text,
      author: userObjectId._id,
      image, 
      parentId: null, // Not a comment/reply
      children: [],
    };

    // If community is provided, associate the thread with it
    let communityIdToUse: mongoose.Types.ObjectId | null = null;
    
    if (communityId && communityId.trim() !== "") {
      const communityObjectId = await Community.findOne({ id: communityId }, { _id: 1 });
      
      if (communityObjectId) {
        communityIdToUse = communityObjectId._id;
        // Now TypeScript knows this property can exist on threadData
        threadData.community = communityObjectId._id;
      }
    }

    // Create the thread
    const createdThread = await Thread.create(threadData);

    // Update the author's threads
    await User.findByIdAndUpdate(userObjectId._id, {
      $push: { threads: createdThread._id },
    });

    // If this thread belongs to a community, update the community's threads too
    if (communityIdToUse) {
      await Community.findByIdAndUpdate(communityIdToUse, {
        $push: { threads: createdThread._id },
      });
    }

    // Revalidate the path to update the UI
    revalidatePath(path);

    return createdThread;
  } catch (error: any) {
    console.error("Error creating thread:", error);
    throw new Error(`Failed to create thread: ${error.message}`);
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

// Add any other thread-related functions here
// For example, fetching threads by community, updating threads, etc.
//   return { success: true, communityId: newCommunity._id };
//   } catch (error: any) {
//     console.error("Error creating community from organization:", error);
//     return { success: false, error: error.message };
//   }