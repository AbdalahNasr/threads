import { OrganizationProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CreateOrganizationPage() {
  const { userId } = await auth();

  // If user is not logged in, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Community</h1>

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
      />
    </div>
  );
}
