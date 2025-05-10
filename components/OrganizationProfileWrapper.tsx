import React from 'react';
import { OrganizationProfile, useOrganization } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { OrganizationRequired } from './OrganizationRequired';

/**
 * A wrapper for the Clerk OrganizationProfile component that ensures
 * it only renders when an organization is active, preventing runtime errors.
 */
export function OrganizationProfileWrapper() {
  return (
    <OrganizationRequired message="Please select or create an organization to view and manage its profile">
      <OrganizationProfile
        appearance={{
          baseTheme: dark,
          elements: {
            rootBox: {
              boxShadow: 'none',
              width: '100%',
            },
            card: {
              border: '1px solid #2D2D2D',
              boxShadow: 'none',
            },
          },
        }}
      />
    </OrganizationRequired>
  );
}
