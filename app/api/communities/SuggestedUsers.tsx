"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  getSuggestedUsers,
  sendFriendRequest,
} from "@/lib/actions/user.actions";

interface User {
  id: string;
  username: string;
  name: string;
  image: string;
}

interface SuggestedUsersProps {
  currentUserId: string;
}

export function SuggestedUsers({ currentUserId }: SuggestedUsersProps) {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(
    new Set()
  );
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        console.log("Fetching suggested users for:", currentUserId);
        const users = await getSuggestedUsers(currentUserId);
        console.log("Fetched suggested users:", users);
        setSuggestedUsers(users);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchSuggestedUsers();
    }
  }, [currentUserId]);

  const handleAddFriend = async (userId: string) => {
    try {
      setPendingRequests((prev) => new Set(prev).add(userId));
      await sendFriendRequest(currentUserId, userId);
      toast({
        title: "Success",
        description: "Friend request sent!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
      console.error("Error sending friend request:", error);
    } finally {
      setPendingRequests((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    }
  };

  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Add debugging output
  console.log("SuggestedUsers render state:", {
    loading,
    usersCount: suggestedUsers.length,
  });

  if (loading) {
    return <div className="mt-4 p-4">Loading suggested users...</div>;
  }

  if (suggestedUsers.length === 0) {
    return (
      <div className="mt-4 p-4 text-muted-foreground">
        No suggested users available
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-lg mb-3">Suggested Users</h3>
      <div className="space-y-3">
        {suggestedUsers.map((user: User) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigateToProfile(user.id)}
            >
              <Image
                src={user.image || "/placeholder-user.jpg"}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={pendingRequests.has(user.id)}
              onClick={(e) => {
                e.stopPropagation();
                handleAddFriend(user.id);
              }}
            >
              {pendingRequests.has(user.id) ? "Sending..." : "Add Friend"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
