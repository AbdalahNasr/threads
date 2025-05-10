import PostThread from "@/components/forms/PostThread";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function Page() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  // Convert MongoDB ObjectID to string before passing to client component
  const userId =
    typeof userInfo._id === "object"
      ? userInfo._id.toString() // Convert ObjectID to string
      : userInfo._id; // Keep string as is

  return (
    <>
      <h1 className="text-head text-light-1">Create threads</h1>
      <PostThread userId={userId} />
    </>
  );
}
export default Page;
