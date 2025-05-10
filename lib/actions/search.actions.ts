import User from "../models/user.model";
import Community from "../models/community.model";
import Thread from "../models/thread.model";
import { connectToDB } from "../mongoose";

interface SearchResult {
  id: string;
  type: 'user' | 'community' | 'post';
  title: string;
  image?: string;
  url: string;
}

export async function searchContent(searchQuery: string): Promise<SearchResult[]> {
  try {
    await connectToDB();
    
    if (!searchQuery || searchQuery.trim() === '') {
      return [];
    }
    
    const regex = new RegExp(searchQuery, 'i');
    const results: SearchResult[] = [];
    
    // Search users
    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { username: { $regex: regex } }
      ]
    }).limit(5);
    
    users.forEach(user => {
      results.push({
        id: user.id,
        type: 'user',
        title: user.name,
        image: user.image,
        url: `/profile/${user.id}`
      });
    });
    
    // Search communities
    const communities = await Community.find({
      $or: [
        { name: { $regex: regex } },
        { bio: { $regex: regex } }
      ]
    }).limit(5);
    
    communities.forEach(community => {
      results.push({
        id: community.id,
        type: 'community',
        title: community.name,
        image: community.image,
        url: `/communities/${community.id}`
      });
    });
    
    // Search threads (posts)
    const threads = await Thread.find({
      text: { $regex: regex }
    })
    .populate({
      path: 'author',
      model: User,
      select: 'name image'
    })
    .limit(5);
    
    threads.forEach(thread => {
      results.push({
        id: thread._id.toString(),
        type: 'post',
        title: `${thread.text.substring(0, 40)}${thread.text.length > 40 ? '...' : ''}`,
        image: thread.author?.image,
        url: `/thread/${thread._id}`
      });
    });
    
    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}