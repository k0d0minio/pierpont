import { redirect } from 'next/navigation';
import { isEditor } from '../../actions/auth';
import { getAllPOCs, getAllVenueTypes } from './actions';
import SettingsClient from './client';
import { ArrowLeft } from 'lucide-react';
import Link from "next/link";

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Link href="/"><ArrowLeft /></Link> Paramètres</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {"Gérez les paramètres de l'application, les points de contact et les types de lieu"}
        </p>
      </div>

      <SettingsClient initialPOCs={pocs} initialVenueTypes={venueTypes} />
    </div>
  );
}
