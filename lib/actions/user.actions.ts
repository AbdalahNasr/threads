"use server";

import { FilterQuery, SortOrder } from "mongoose";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  image: string;
}

export async function getSuggestedUsers(currentUserId: string): Promise<SuggestedUser[]> {
  try {
    console.log("Getting suggested users for:", currentUserId);
    await connectToDB();

    // Find the current user to get their following list
    const currentUser = await User.findOne({ id: currentUserId })
      .select('_id following')
      .exec();
    
    if (!currentUser) {
      console.error("Current user not found in database");
      return [];
    }

    console.log("Current user found:", currentUser._id);
    
    // Create a query to find users that current user is not following
    // and who are not the current user
    const suggestedUsersQuery = User.find({
      _id: { $ne: currentUser._id },
    });

    // If user is following others, exclude them from suggestions
    if (currentUser.following && currentUser.following.length > 0) {
      suggestedUsersQuery.where('_id').nin(currentUser.following);
    }

    // Limit to 5 suggestions and select only needed fields
    const suggestedUsers = await suggestedUsersQuery
      .select('id name username image')
      .limit(5)
      .exec();

    console.log(`Found ${suggestedUsers.length} suggested users`);

    // Map to the expected format with explicit type
    return suggestedUsers.map((user): SuggestedUser => ({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image || "/placeholder-user.jpg"
    }));
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return []; // Return empty array instead of throwing to avoid breaking UI
  }
}

export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<{ success: boolean }> {
  try {
    await connectToDB();

    // Find both users
    const fromUser = await User.findOne({ id: fromUserId });
    const toUser = await User.findOne({ id: toUserId });
    
    if (!fromUser || !toUser) {
      throw new Error("One or both users not found");
    }

    // Check if request already exists
    const alreadySent = fromUser.sentRequests?.some((id: mongoose.Types.ObjectId) => 
      id.toString() === toUser._id.toString()
    );
    const alreadyFriends = fromUser.following?.some((id: mongoose.Types.ObjectId) => 
      id.toString() === toUser._id.toString()
    );
    
    if (alreadySent) {
      throw new Error("Friend request already sent");
    }
    
    if (alreadyFriends) {
      throw new Error("Already following this user");
    }

    // Update the sender's sentRequests
    await User.findByIdAndUpdate(
      fromUser._id,
      { $addToSet: { sentRequests: toUser._id } }
    );

    // Update the receiver's receivedRequests
    await User.findByIdAndUpdate(
      toUser._id,
      { $addToSet: { receivedRequests: fromUser._id } }
    );

    // Revalidate paths
    revalidatePath(`/profile/${toUserId}`);
    revalidatePath(`/profile/${fromUserId}`);

    return { success: true };
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
}

export async function fetchUser(userId: string): Promise<any> {
  try {
    await connectToDB();

    return await User.findOne({ id: userId }).populate({
      path: "communities",
      model: Community,
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

interface UpdateUserParams {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
}: UpdateUserParams): Promise<void> {
  try {
    await connectToDB();

    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUserPost(userId: string): Promise<any> {
  try {
    connectToDB();

    // Find all threads authored by the user with the given userId
    const threads = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "community",
          model: Community,
          select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });
    return threads;
  } catch (error) {
    console.error("Error fetching user threads:", error);
    throw error;
  }
}

// Almost similar to Thead (search + pagination) and Community (search + pagination)
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}): Promise<{ users: any[]; isNext: boolean }> {
  try {
    connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getActivity(userId: string): Promise<any[]> {
  try {
    connectToDB();

    // Find all threads created by the user
    const userThreads = await Thread.find({ author: userId });

    // Collect all the child thread ids (replies) from the 'children' field of each user thread
    const childThreadIds = userThreads.reduce((acc: any[], userThread) => {
      return acc.concat(userThread.children);
    }, []);

    // Find and return the child threads (replies) excluding the ones created by the same user
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }, // Exclude threads authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  }
}
