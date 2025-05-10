import { OrganizationProfile } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CreateOrganizationPage() {
  const { userId } = await auth();
  const user = await currentUser();

  // If user is not logged in, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has set up profile
  try {
    const userDoc = await import("@/lib/actions/user.actions").then((module) =>
      module.fetchUser(userId)
    );

    if (!userDoc?.onboarded) {
      redirect("/onboarding");
    }
  } catch (error) {
    console.error("Error checking user profile:", error);
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Community</h1>

      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <OrganizationProfile
          appearance={{
            elements: {
              rootBox: {
                boxShadow: "none",
                width: "100%",
              },
              card: {
                border: "1px solid #e5e7eb",
                boxShadow: "none",
                width: "100%",
              },
            },
          }}
          routing="path"
          path="/create-organization"
        />
      </Suspense>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">How Communities Work</h2>
        <p className="text-gray-600">
          Communities in Threads allow you to create spaces for discussions
          around shared interests. Create a community to:
        </p>
        <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
          <li>Share posts with members who share your interests</li>
          <li>Moderate discussions and foster healthy conversations</li>
          <li>Create private spaces for specific groups</li>
          <li>Build connections with like-minded people</li>
        </ul>
      </div>
    </div>
  );
}
