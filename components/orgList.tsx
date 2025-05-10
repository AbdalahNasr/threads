"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Community {
  _id: string;
  id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  members: string[];
}

export default function OrgList() {
  const { orgId } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/orgs");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch communities");
        }
        
        const data = await response.json();
        setCommunities(data);
      } catch (err) {
        console.error("Error fetching communities:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Your Communities</h2>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Your Communities</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Communities</h2>
      
      {orgId && (
        <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">Current Organization ID: {orgId}</p>
        </div>
      )}
      
      {communities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">You don't belong to any communities yet.</p>
          <Link href="/create-community">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Create a Community
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Link key={community._id} href={`/communities/${community.username}`}>
              <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-gray-100 relative">
                  {community.image ? (
                    <Image
                      src={community.image}
                      alt={community.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200">
                      <span className="text-2xl font-bold text-gray-400">
                        {community.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold">{community.name}</h3>
                  <p className="text-sm text-gray-500">@{community.username}</p>
                  <p className="text-sm mt-2 line-clamp-2">
                    {community.bio || "No description available"}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    {community.members.length} member{community.members.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}