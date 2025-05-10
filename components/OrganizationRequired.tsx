import { useOrganization } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface OrganizationRequiredProps {
  message?: string;
  children: React.ReactNode;
}

/**
 * Organization Required
 * 
 * A component that only renders its children if an organization is active.
 * Otherwise, it displays a message asking the user to create or select an organization.
 */
export function OrganizationRequired({ 
  message = "You need to be in an organization to view this content.", 
  children 
}: OrganizationRequiredProps) {
  const { organization, isLoaded } = useOrganization();
  
  // Don't render anything while loading
  if (!isLoaded) return null;
  
  // If no organization is active, show a message
  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Organization Required</h2>
        <p className="text-light-2 mb-4">{message}</p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/organization/create">Create Organization</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Organization is active, render children
  return <>{children}</>;
}

// Finally, let's implement a component you can use to safely render the Clerk `OrganizationProfile` component:
