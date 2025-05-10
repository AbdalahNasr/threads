"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "../ui/button";
import JoinButton from "../community/JoinButton";

interface Props {
  community: {
    id: string;
    _id?: string;
    name: string;
    username: string;
    image: string;
    bio: string;
    members: {
      image: string;
    }[];
    isUserMember?: boolean;
  };
}

function CommunityCard({ community }: Props) {
  const { userId } = useAuth();

  // Safely get the community ID, preferring _id if it exists
  const communityId = community?.id || community?._id;

  if (!communityId) {
    console.warn("Community ID is missing:", community);
    return null;
  }

  return (
    <article className="community-card">
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href={`/communities/${communityId}`}
              className="relative h-12 w-12"
            >
              <Image
                src={community.image}
                alt="community_logo"
                fill
                className="rounded-full object-cover"
              />
            </Link>

            <div className="flex-1">
              <Link href={`/communities/${communityId}`}>
                <h4 className="text-base-semibold text-light-1">
                  {community.name}
                </h4>
              </Link>
              <p className="text-small-medium text-gray-1">
                @{community.username}
              </p>
            </div>

            {community.isUserMember && (
              <span className="text-small-medium text-green-500">Member</span>
            )}
          </div>

          <p className="mt-4 text-subtle-medium text-gray-1">{community.bio}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Link href={`/communities/${communityId}`}>
              <Button size="sm" className="community-card_btn">
                View
              </Button>
            </Link>

            {userId && !community.isUserMember && (
              <JoinButton communityId={communityId} userId={userId} />
            )}
          </div>

          {community.members.length > 0 && (
            <div className="flex items-center ml-auto">
              <div className="flex -space-x-2">
                {community.members.slice(0, 3).map((member, index) => (
                  <Image
                    key={index}
                    src={member.image}
                    alt={`user_${index}`}
                    width={28}
                    height={28}
                    className="rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              {community.members.length > 3 && (
                <p className="ml-2 text-subtle-medium text-gray-1">
                  +{community.members.length - 3}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default CommunityCard;
