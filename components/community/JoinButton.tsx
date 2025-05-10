"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { joinCommunity } from "@/lib/actions/community.actions";

const toastStyles = {
  className: `
    fixed md:w-[300px] 
    top-4 md:top-auto md:bottom-4 
    right-4 
    flex flex-col gap-2 
    border-none 
    bg-dark-2
    animate-in fade-in-0 
    relative
    after:content-[''] 
    after:absolute 
    after:bottom-0 
    after:left-0 
    after:h-[2px] 
    after:w-full 
    after:[animation:progress_3s_linear_forwards]
  `,
  layout: {
    position: "top-right",
  },
  duration: 3000,
};

interface JoinButtonProps {
  communityId: string;
  userId: string;
}

const JoinButton = ({ communityId, userId }: JoinButtonProps) => {
  const { toast } = useToast();
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast({
        title: "Sign in required",
        description: "You need to be signed in to join a community",
        variant: "destructive",
        className: `${toastStyles.className} after:bg-red-500 text-red-500`,
        layout: toastStyles.layout,
        duration: toastStyles.duration,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await joinCommunity({
        communityId,
        userId,
      });

      if (response.success) {
        setIsJoined(true);
        toast({
          title: "Welcome!",
          description: response.message || "Successfully joined the community!",
          variant: "default",
          className: `${toastStyles.className} after:bg-green-500 text-green-500`,
          layout: toastStyles.layout,
          duration: toastStyles.duration,
        });

        // Wait for toast to show before reloading
        await new Promise((resolve) => setTimeout(resolve, 2000));
        window.location.reload();
      } else {
        setIsJoined(false); // Reset joined state on failure
        toast({
          title: "Error",
          description: response.error || "Failed to join community",
          variant: "destructive",
          className: `${toastStyles.className} after:bg-red-500 text-red-500`,
          layout: toastStyles.layout,
          duration: toastStyles.duration,
        });
      }
    } catch (error) {
      setIsJoined(false); // Reset joined state on error
      console.error("Error joining community:", error);
      toast({
        title: "Error",
        description: "Something went wrong while joining the community",
        variant: "destructive",
        className: `${toastStyles.className} after:bg-red-500 text-red-500`,
        layout: toastStyles.layout,
        duration: toastStyles.duration,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading || isJoined}
      variant="default"
      size="sm"
      className={`min-w-[80px] text-light-1 transition-colors duration-200 ${
        isJoined
          ? "bg-green-600 hover:bg-green-500"
          : "bg-primary-500 hover:bg-primary-400"
      }`}
    >
      {isLoading ? "Joining..." : isJoined ? "Member" : "Join"}
    </Button>
  );
};

export default JoinButton;
