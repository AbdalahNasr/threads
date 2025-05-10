"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  addMemberToCommunity,
  removeMemberFromCommunity,
} from "@/lib/actions/community.actions";

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

interface CommunityJoinButtonProps {
  communityId: string;
  isMember: boolean;
  userId: string;
  updateMembersCount?: (delta: number) => void;
}

const CommunityJoinButton = ({
  communityId,
  isMember: initialIsMember,
  userId,
  updateMembersCount,
}: CommunityJoinButtonProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [memberStatus, setMemberStatus] = useState(initialIsMember);

  const handleMembershipToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast({
        title: "Sign in required",
        description: "You need to be signed in to join or leave a community",
        variant: "destructive",
        className: `${toastStyles.className} after:bg-red-500 text-red-500`,
        layout: toastStyles.layout,
        duration: toastStyles.duration,
      });
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Handle join attempt
      if (!memberStatus) {
        const result = await addMemberToCommunity(communityId, userId);

        if (result.success) {
          // Successfully joined
          setMemberStatus(true);
          if (updateMembersCount) {
            updateMembersCount(1);
          }
          toast({
            title: "Welcome!",
            description: "Successfully joined the community",
            variant: "default",
            className: `${toastStyles.className} after:bg-green-500 text-green-500`,
            layout: toastStyles.layout,
            duration: toastStyles.duration,
          });
        } else {
          // Failed to join - show specific error
          if (result.error === "Already a member") {
            setMemberStatus(true); // Update local state to match server
            toast({
              title: "Already a member",
              description: "You are already a member of this community",
              variant: "destructive",
              className: `${toastStyles.className} after:bg-red-500 text-red-500`,
              layout: toastStyles.layout,
              duration: toastStyles.duration,
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to join community",
              variant: "destructive",
              className: `${toastStyles.className} after:bg-red-500 text-red-500`,
              layout: toastStyles.layout,
              duration: toastStyles.duration,
            });
          }
        }
      } 
      // Handle leave attempt
      else {
        const result = await removeMemberFromCommunity(communityId, userId);
        
        if (result.success) {
          setMemberStatus(false);
          if (updateMembersCount) {
            updateMembersCount(-1);
          }
          toast({
            title: "Left community",
            description: "You have left the community",
            variant: "default",
            className: `${toastStyles.className} after:bg-red-500 text-red-500`,
            layout: toastStyles.layout,
            duration: toastStyles.duration,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling membership:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
        className: `${toastStyles.className} after:bg-red-500 text-red-500`,
        layout: toastStyles.layout,
        duration: toastStyles.duration,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleMembershipToggle}
      disabled={isProcessing}
      variant={memberStatus ? "outline" : "default"}
      className={`min-w-[120px] text-light-1 transition-colors duration ${
        memberStatus ? "community-member-badge" : "join-community-btn"
      }`}
    >
      {isProcessing ? (
        "Processing..."
      ) : memberStatus ? (
        <>
          <Image
            src="/assets/members.svg"
            alt="member"
            width={16}
            height={16}
            className="mr-2"
          />
          Member
        </>
      ) : (
        "Join Community"
      )}
    </Button>
  );
};

export default CommunityJoinButton;
