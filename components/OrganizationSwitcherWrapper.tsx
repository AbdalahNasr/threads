"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dark } from "@clerk/themes";
import { useOrganization, useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { PlusIcon } from "lucide-react";

export default function OrganizationSwitcherWrapper() {
  const { organization } = useOrganization();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Effect to sync organizations when they change
  useEffect(() => {
    // Only run when the user is loaded and we have the user data
    if (!isLoaded || !user) return;

    // This effect runs when the component mounts or when the organization changes
    const syncUserOrgs = async () => {
      try {
        // Try to sync the user's organizations
        await fetch(`/api/sync-organization?userId=${user.id}`, {
          method: "GET",
        });
        console.log("Organizations synced successfully");
      } catch (error) {
        console.error("Error syncing organizations:", error);
      }
    };

    syncUserOrgs();
  }, [isLoaded, user, organization?.id]);

  // Handler for creating a new organization
  const handleCreateOrg = () => {
    router.push('/create-organization');
  };

  return (
    <div className="flex items-center gap-4">
      <OrganizationSwitcher
        appearance={{
          baseTheme: dark,
          elements: {
            organizationSwitcherTrigger: "py-2 px-4",
          },
        }}
        hidePersonal={false}
        createOrganizationUrl="/create-organization"
        createOrganizationMode="navigation"
        afterCreateOrganizationUrl="/communities"
        afterSelectOrganizationUrl={`/communities/`}
        afterSelectPersonalUrl="/"
      />
      
      {/* Create organization button */}
      <Button 
        onClick={handleCreateOrg} 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1 text-primary-500"
      >
        <PlusIcon className="h-4 w-4" />
        <span>New Org</span>
      </Button>
    </div>
  );
}
