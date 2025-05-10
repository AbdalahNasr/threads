import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Thread from "@/lib/models/thread.model";
import User from "@/lib/models/user.model";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const { threadId, comment, userId, path } = await req.json();

    await connectToDB();

    // Find the user
    const user = await User.findOne({ id: userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create a new thread as a comment
    const newComment = await Thread.create({
      text: comment,
      author: user._id,
      parentId: threadId,
      children: [],
    });

    // Add the comment to the parent thread's children
    await Thread.findByIdAndUpdate(threadId, {
      $push: { children: newComment._id },
    });

    revalidatePath(path);

    return NextResponse.json(
      { message: "Comment created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Error creating comment" },
      { status: 500 }
    );
  }
} 