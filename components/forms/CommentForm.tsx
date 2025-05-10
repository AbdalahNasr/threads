"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Props {
  threadId: string;
  currentUserImg: string;
  currentUserId: string;
}

const CommentForm = ({ threadId, currentUserImg, currentUserId }: Props) => {
  const [comment, setComment] = useState("");
  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/thread/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          comment,
          userId: currentUserId,
          path: pathname,
        }),
      });

      if (response.ok) {
        setComment("");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <Image
          src={currentUserImg}
          alt="Profile image"
          width={40}
          height={40}
          className="rounded-full"
        />
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-dark-2 text-light-1 outline-none border-none rounded-lg p-2"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        disabled={!comment.trim()}
      >
        Reply
      </button>
    </form>
  );
};

export default CommentForm; 