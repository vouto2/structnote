import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import MapEditor from '@/components/MapEditor'; // This component will be created next

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { mapId: string };
};

// TODO: Define these types globally
export type MapData = {
  id: string;
  title: string;
  nodes: NodeData[];
};

export type NodeData = {
  id: string;
  map_id: string;
  node_type: string;
  title: string;
  details: string;
  child_map_id: string | null;
};

async function getMapData(supabase: any, mapId: string): Promise<MapData | null> {
  const { data: map, error: mapError } = await supabase
    .from('maps')
    .select('id, title')
    .eq('id', mapId)
    .single();

  if (mapError || !map) {
    console.error('Error fetching map:', mapError);
    return null;
  }

  const { data: nodes, error: nodesError } = await supabase
    .from('nodes')
    .select('*')
    .eq('map_id', mapId);

  if (nodesError) {
    console.error('Error fetching nodes:', nodesError);
    // Return map without nodes if nodes fail to load
    return { ...map, nodes: [] };
  }

  console.log('Fetched nodes for map:', map.title, nodes); // Add this log

  return { ...map, nodes };
}

export default async function MapPage({ params }: PageProps) {
  const supabase = await createClient();
  const mapData = await getMapData(supabase, params.mapId);

  if (!mapData) {
    return <div className="text-center p-8">マップが見つかりません。</div>;
  }

  return (
    <div className="w-full h-full">
      {/* The MapEditor will be a client component handling the complex UI */}
      <MapEditor initialMapData={mapData} />
    </div>
  );
}