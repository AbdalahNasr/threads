"use client";

import { formatDateString } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  likeThread,
  repostThread,
  shareThread,
} from "@/lib/actions/thread.action";
import { usePathname } from "next/navigation";
import CommentForm from "../forms/CommentForm";

interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
  author: {
    name: string;
    image: string;
    id: string;
  };
  community: {
    id: string;
    name: string;
    image: string;
  } | null;
  createdAt: string;
  comments: {
    author: {
      image: string;
    };
  }[];
  isComment?: boolean;
  likes?: string[];
  reposts?: string[];
}

const ThreadCard = ({
  id,
  currentUserId,
  parentId,
  content,
  author,
  community,
  createdAt,
  comments,
  isComment,
  likes = [],
  reposts = [],
}: Props) => {
  const pathname = usePathname();
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Use a single state object to track all interactive states
  const [interactionState, setInteractionState] = useState({
    isLiked: likes.includes(currentUserId),
    likeCount: likes.length,
    isReposted: reposts.includes(currentUserId),
    repostCount: reposts.length,
  });

  // Memoize handlers to prevent unnecessary re-renders
  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const result = await likeThread(id, currentUserId, pathname);
        if (result.success) {
          setInteractionState((prev) => ({
            ...prev,
            isLiked: !prev.isLiked,
            likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
          }));
        } else {
          console.error("Error liking thread:", result.error);
          // Reset to previous state if there was an error
          setInteractionState((prev) => ({
            ...prev,
            isLiked: likes.includes(currentUserId),
            likeCount: likes.length,
          }));
        }
      } catch (error) {
        console.error("Error liking thread:", error);
        // Reset to previous state if there was an error
        setInteractionState((prev) => ({
          ...prev,
          isLiked: likes.includes(currentUserId),
          likeCount: likes.length,
        }));
      }
    },
    [id, currentUserId, pathname, likes]
  );

  const handleRepost = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const result = await repostThread(id, currentUserId, pathname);
        if (result.success) {
          setInteractionState((prev) => ({
            ...prev,
            isReposted: !prev.isReposted,
            repostCount: prev.isReposted
              ? prev.repostCount - 1
              : prev.repostCount + 1,
          }));
        }
      } catch (error) {
        console.error("Error reposting thread:", error);
      }
    },
    [id, currentUserId, pathname]
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const result = await shareThread(id);
        if (result.success) {
          await navigator.clipboard.writeText(
            `${window.location.origin}${result.url}`
          );
          alert("Thread URL copied to clipboard!");
        }
      } catch (error) {
        console.error("Error sharing thread:", error);
      }
    },
    [id]
  );

  // Early return if required props are missing
  if (!author || !content) {
    return null;
  }

  return (
    <article
      className={`flex w-full flex-col rounded-xl ${
        isComment ? "px-0 xs:px-7" : "bg-dark-2 p-7"
      }`}
    >
      <div className="flex flex-start justify-between">
        <div className="flex w-full flex-1 flex-row gap-4">
          <div className="flex flex-col items-center">
            <Link href={`/profile/${author.id}`} className="relative w-10 h-10">
              <Image
                alt="author image"
                src={author.image}
                fill
                className="cursor-pointer rounded-full"
              />
            </Link>
            <div className="thread-card_bar" />
          </div>
          <div className="flex w-full flex-col">
            <Link href={`/profile/${author.id}`} className="w-fit">
              <h4 className="cursor-pointer text-base-semibold text-light-1">
                {author.name}
              </h4>
            </Link>
            <p className="mt-2 text-small-regular text-light-2">{content}</p>
            <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
              <div className="flex gap-3.5">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1"
                  aria-label="Like thread"
                >
                  <Image
                    src={
                      interactionState.isLiked
                        ? "/assets/heart-filled.svg"
                        : "/assets/heart-gray.svg"
                    }
                    alt="heart"
                    width={24}
                    height={24}
                    className="cursor-pointer object-contain"
                  />
                  <span className="text-small-regular text-gray-1">
                    {interactionState.likeCount}
                  </span>
                </button>
                <button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="flex items-center gap-1"
                  aria-label="Reply to thread"
                >
                  <Image
                    src="/assets/reply.svg"
                    alt="reply"
                    width={24}
                    height={24}
                    className="cursor-pointer object-contain"
                  />
                  <span className="text-small-regular text-gray-1">
                    {comments.length}
                  </span>
                </button>
                <button
                  onClick={handleRepost}
                  className="flex items-center gap-1"
                  aria-label="Repost thread"
                >
                  <Image
                    src={
                      interactionState.isReposted
                        ? "/assets/repost-filled.svg"
                        : "/assets/repost.svg"
                    }
                    alt="repost"
                    width={24}
                    height={24}
                    className="cursor-pointer object-contain"
                  />
                  <span className="text-small-regular text-gray-1">
                    {interactionState.repostCount}
                  </span>
                </button>
                <button onClick={handleShare} aria-label="Share thread">
                  <Image
                    src="/assets/share.svg"
                    alt="share"
                    width={24}
                    height={24}
                    className="cursor-pointer object-contain"
                  />
                </button>
              </div>
              {showCommentForm && (
                <CommentForm
                  threadId={id}
                  currentUserId={currentUserId}
                  currentUserImg={author.image}
                />
              )}
              {isComment && comments.length > 0 && (
                <Link href={`/thread/${id}`}>
                  <p className="mt-1 text-subtle-medium text-gray-1">
                    {comments.length} repl{comments.length > 1 ? "ies" : "y"}
                  </p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {!isComment && community && (
        <Link
          href={`/communities/${community.id}`}
          className="mt-5 flex items-center"
        >
          <p className="text-subtle-medium text-gray-1">
            {formatDateString(createdAt)} - {community.name} Community
          </p>
          <Image
            src={community.image}
            alt={community.name}
            width={14}
            height={14}
            className="ml-1 rounded-full object-cover"
          />
        </Link>
      )}
    </article>
  );
};

export default ThreadCard;
