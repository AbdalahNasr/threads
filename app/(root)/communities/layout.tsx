import { OrganizationSwitcher } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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
    <section className="flex flex-col">
      <div className="w-full flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">Communities</h1>
        <OrganizationSwitcher
          hidePersonal
          createOrganizationMode="modal"
          afterCreateOrganizationUrl="/communities"
          afterSelectOrganizationUrl="/communities"
        />
      </div>
      <div className="w-full">{children}</div>
    </section>
  );
}
