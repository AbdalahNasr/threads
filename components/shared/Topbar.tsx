"use client";

import Link from "next/link";
import Image from "next/image";
import {
  OrganizationSwitcher,
  SignedIn,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

function TopBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateOrg = () => {
    router.push("/organization/create");
  };

  if (!mounted) return null;

  return (
    <nav className="topbar">
      <Link href="/" className="flex items-center gap-4">
        <Image src="/logo.svg" alt="Threads" width={28} height={28} />
        <p className="text-heading3-bold text-light-1 max-xs:hidden">Threads</p>
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <SignedIn>
            <OrganizationSwitcher
              appearance={{
                baseTheme: dark,
                elements: {
                  organizationSwitcherTrigger: "py-2 px-4",
                },
              }}
            />

            <Button
              onClick={handleCreateOrg}
              variant="outline"
              size="sm"
              className="ml-4 flex items-center gap-1 text-light-2"
            >
              <span className="text-lg font-bold">+</span>
              <span>New Org</span>
            </Button>
          </SignedIn>
        </div>

        <div className="block md:hidden">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        <div className="hidden md:block">
          <SignedIn>
            <SignOutButton>
              <div className="flex cursor-pointer gap-4 p-4">
                <Image
                  src="/assets/logout.svg"
                  alt="logout"
                  width={24}
                  height={24}
                />
                <p className="text-light-2 max-lg:hidden">Logout</p>
              </div>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

export default TopBar;
