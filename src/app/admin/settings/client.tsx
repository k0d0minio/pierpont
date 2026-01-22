"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import POCManagement from './poc';
import VenueManagement from './venue';
import type { PointOfContact, VenueType } from '../../../types/supabase';

type SettingsClientProps = {
  initialPOCs?: PointOfContact[];
  initialVenueTypes?: VenueType[];
}

export default function SettingsClient({ initialPOCs = [], initialVenueTypes = [] }: SettingsClientProps) {

  return (
    <div className="space-y-8">
      {/* Tabbed Settings Sections */}
      <Tabs defaultValue="pocs" className="w-full">
        <TabsList>
          <TabsTrigger value="pocs">Points of Contact</TabsTrigger>
          <TabsTrigger value="venue-types">Venue Types</TabsTrigger>
        </TabsList>

        {/* POC Management Section */}
        <TabsContent value="pocs" className="mt-6">
          <POCManagement initialPOCs={initialPOCs} />
        </TabsContent>

        {/* Venue Type Management Section */}
        <TabsContent value="venue-types" className="mt-6">
          <VenueManagement initialVenueTypes={initialVenueTypes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
