import { redirect } from 'next/navigation';
import { isEditor } from '../../actions/auth';
import { getAllPOCs, getAllVenueTypes } from './actions';
import SettingsClient from './SettingsClient';
import { Heading } from '../../../../components/heading';
import { Logo } from '../../../../components/logo';
import { APP_VERSION } from '../../../lib/config';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Check if user is authenticated as admin
  const authenticated = await isEditor();
  
  if (!authenticated) {
    redirect('/admin');
  }

  // Fetch POCs and venue types for initial render
  const pocsResult = await getAllPOCs();
  const pocs = pocsResult.ok ? pocsResult.data : [];
  
  const venueTypesResult = await getAllVenueTypes();
  const venueTypes = venueTypesResult.ok ? venueTypesResult.data : [];

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <Logo size="xl" />
      </div>
      
      <div className="mb-6">
        <Heading level={1}>Settings</Heading>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Manage application settings, points of contact, and venue types
        </p>
      </div>

      <SettingsClient initialPOCs={pocs} initialVenueTypes={venueTypes} appVersion={APP_VERSION} />
    </div>
  );
}

