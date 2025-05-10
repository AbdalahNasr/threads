"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { fetchSuggestedCommunities } from "@/lib/actions/community.actions";
import { Community as CommunityType } from "@/lib/types/community.types";

function RightSidebar() {
  const { userId } = useAuth();
  const [communities, setCommunities] = useState<CommunityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const suggestedCommunities = await fetchSuggestedCommunities(userId, 4);
        setCommunities(suggestedCommunities || []);
      } catch (error) {
        console.error("Error fetching communities:", error);
        setCommunities([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted && userId) {
      fetchCommunities();
    }
  }, [userId, mounted]);

  if (!mounted) return null;

  return (
    <section className="custom-scrollbar rightsidebar">
      <div className="flex flex-1 flex-col justify-start">
        <h3 className="text-heading4-medium text-light-1">
          Suggested Communities
        </h3>

        {isLoading ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-light-3">Loading suggestions...</p>
          {/* change that loader later */}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {communities.map((community) => (
              <Link
                key={community._id}
                href={`/communities/${community._id}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={community.image || "/assets/community.svg"}
                    alt={community.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-base-medium text-light-1">
                      {community.name}
                    </p>
                    <p className="text-subtle-medium text-gray-1">
                      @{community.username}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default RightSidebar;
