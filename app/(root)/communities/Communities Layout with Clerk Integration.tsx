import { ClerkProvider,  } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { auth  } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationContextProvider } from "@/components/OrganizationContextProvider";

const inter = Inter({ subsets: ["latin"] });

export default async function CommunitiesLayout(
  {
    children,
  }: {
    children: React.ReactNode;
  }
) {
  const { orgId, userId } = await auth();

  // If user is not logged in, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <ClerkProvider>
      <OrganizationContextProvider>
        <section className="flex flex-col">
          <div className="w-full">
            {children}
          </div>
        </section>
      </OrganizationContextProvider>
    </ClerkProvider>
  );
}