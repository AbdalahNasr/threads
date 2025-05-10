import { ReactNode } from "react";
import Link from "next/link";
import { useOrganizationContext } from "@/components/OrganizationContextProvider";

interface OrganizationRequiredProps {
  children: ReactNode;
  message?: string;
}

/**
 * Organization Required
 * 
 * A component that only renders its children if an organization is active.
 * Otherwise, it displays a message asking the user to create or select an organization.
 */
export function OrganizationRequired({
  children,
  message = "This feature requires an organization to be active",
}: OrganizationRequiredProps) {
  const { isActive, isLoaded } = useOrganizationContext();
  
  // Don't render anything while loading
  if (!isLoaded) return null;
  
  // If no organization is active, show a message
  if (!isActive) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Organization Required</h3>
        <p className="text-yellow-700 mb-4">{message}</p>
        <Link href="/create-organization">
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
            Create Organization
          </button>
        </Link>
      </div>
    );
  }
  
  // Organization is active, render children
  return <>{children}</>;
}
