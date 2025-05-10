"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCommunity } from "@/lib/actions/community.actions";
import {
  syncClerkOrganizations,
  createCommunityFromOrganization,
} from "@/lib/actions/clerk-sync.actions";
import { diagnosticCreateCommunity } from "@/lib/actions/community-diagnostic";
import { refreshCommunityCache } from "@/lib/actions/refresh-cache.actions";
import { useToast } from "@/components/ui/use-toast";

// Form schema definition
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Community name must be at least 2 characters.",
  }),
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  bio: z.string().optional(),
});

export default function EnhancedCreateCommunity() {
  const router = useRouter();
  const { toast } = useToast();
  const { userId } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Set up form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      bio: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be signed in to create a community",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugInfo(null);

    try {
      // Step 1: Create the organization in Clerk
      let clerkOrgId: string | undefined;

      try {
        // Create the organization in Clerk - make sure to include the createdBy parameter
        const response = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            slug: values.username,
            createdBy: userId, // This is the required parameter
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create organization in Clerk");
        }

        const data = await response.json();
        clerkOrgId = data.id; // Get the ID of the new organization

        toast({
          title: "Organization created",
          description: "Successfully created organization in Clerk",
        });
      } catch (error: any) {
        console.error("Error creating Clerk organization:", error);
        toast({
          title: "Error",
          description: `Failed to create organization: ${error.message}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Create community in MongoDB via two approaches for redundancy

      // Approach 1: Use the createCommunityFromOrganization function
      if (clerkOrgId) {
        const syncResult = await createCommunityFromOrganization(
          clerkOrgId,
          userId
        );

        if (syncResult.success) {
          toast({
            title: "Success via Sync",
            description: syncResult.existing
              ? "Connected to existing community"
              : "Community created and synced with Clerk organization",
          });
        } else {
          console.error("Sync error:", syncResult.error);
        }
      }

      // Approach 2: Direct community creation with diagnostic info
      const result = await diagnosticCreateCommunity({
        name: values.name,
        username: values.username,
        bio: values.bio || "",
        creatorId: userId,
        clerkId: clerkOrgId, // Link to the Clerk organization
      });

      // Store debug info for troubleshooting
      if (result.debug) {
        setDebugInfo(result.debug);
        console.log("Debug info:", result.debug);
      }

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your community has been created successfully.",
        });

        // Sync all organizations to ensure everything is in sync
        await syncClerkOrganizations(userId);

        // Force refresh communities data
        try {
          // Use the refreshCommunityCache action with object parameter
          const refreshResult = await refreshCommunityCache({
            path: "/communities",
          });
          console.log("Cache refresh result:", refreshResult);

          // Force router to refresh current data
          router.refresh();
        } catch (refreshError) {
          console.error("Error refreshing cache:", refreshError);
        }

        // Redirect to the communities page after a short delay to allow cache invalidation
        setTimeout(() => {
          router.push("/communities");
        }, 500);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create community",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error in community creation:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community Name</FormLabel>
              <FormControl>
                <Input placeholder="Threads Community" {...field} />
              </FormControl>
              <FormDescription>
                This is your community's name as it will appear on the platform.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community Username</FormLabel>
              <FormControl>
                <Input placeholder="threads-community" {...field} />
              </FormControl>
              <FormDescription>
                This will be used in your community's URL:
                threads.net/communities/{field.value}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your community..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of your community.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Community"}
        </Button>

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
            <h3 className="text-sm font-medium mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto max-h-40">{debugInfo}</pre>
          </div>
        )}
      </form>
    </Form>
  );
}
