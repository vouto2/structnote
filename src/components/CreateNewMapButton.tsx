'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

const NODE_TYPES = [
  'origin', 'purpose', 'vision', 'value',
  'strategy', 'action', 'obstacle', 'resource'
];

export default function CreateNewMapButton({ folderId }: { folderId: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  const handleNewMap = async () => {
    const title = window.prompt('新しいマップのタイトルを入力してください:');
    if (!title) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('エラー: ユーザーが認証されていません。');
      return;
    }

    // 1. Create the new map
    const { data: newMap, error: mapError } = await supabase
      .from('maps')
      .insert({ title, user_id: user.id, folder_id: folderId }) // folder_id can now be null
      .select()
      .single();

    if (mapError || !newMap) {
      alert(`マップの作成に失敗しました: ${mapError?.message}`);
      return;
    }

    // 2. Create the 8 default nodes for the new map
    const nodesToInsert = NODE_TYPES.map(nodeType => ({
      map_id: newMap.id,
      node_type: nodeType,
      title: nodeType.charAt(0).toUpperCase() + nodeType.slice(1), // Capitalize first letter
      details: ''
    }));

    const { error: nodesError } = await supabase.from('nodes').insert(nodesToInsert);

    if (nodesError) {
      alert(`ノードの作成に失敗しました: ${nodesError.message}`);
      // TODO: Delete the map if node creation fails (or use a transaction/edge function)
      return;
    }

    // 3. Redirect to the new map page
    router.push(`/dashboard/map/${newMap.id}`);
  };

  return (
    <button
      onClick={handleNewMap}
      className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md font-semibold text-sm hover:bg-slate-50 flex items-center space-x-2"
    >
      <Plus className="w-4 h-4" />
      <span>新規マップを作成</span>
    </button>
  );
}
