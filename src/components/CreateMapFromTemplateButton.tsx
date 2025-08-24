'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import CreateMapModal from './CreateMapModal';

const NODE_TYPES = [
  'origin', 'purpose', 'vision', 'value',
  'strategy', 'action', 'obstacle', 'resource'
];

export default function CreateMapFromTemplateButton({ templateId, templateTitle, folderId }: { templateId: string; templateTitle: string; folderId: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [isCreateMapModalOpen, setIsCreateMapModalOpen] = useState(false);

  const handleCreateFromTemplate = async (newMapTitle: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('エラー: ユーザーが認証されていません。');
      return;
    }

    // 1. Fetch nodes from the template map
    const { data: templateNodes, error: fetchNodesError } = await supabase
      .from('nodes')
      .select('node_type, title, details')
      .eq('map_id', templateId);

    if (fetchNodesError || !templateNodes) {
      alert(`テンプレートノードの取得に失敗しました: ${fetchNodesError?.message}`);
      return;
    }

    // 2. Create the new map
    const { data: newMap, error: mapError } = await supabase
      .from('maps')
      .insert({ title: newMapTitle, user_id: user.id, is_template: false, folder_id: folderId }) // Pass folderId
      .select()
      .single();

    if (mapError || !newMap) {
      alert(`マップの作成に失敗しました: ${mapError?.message}`);
      return;
    }

    // 3. Create nodes for the new map, copying from template nodes
    const nodesToInsert = templateNodes.map(node => ({
      map_id: newMap.id,
      node_type: node.node_type,
      title: node.title,
      details: node.details,
    }));

    const { error: nodesError } = await supabase.from('nodes').insert(nodesToInsert);

    if (nodesError) {
      alert(`ノードの作成に失敗しました: ${nodesError.message}`);
      // TODO: Delete the map if node creation fails
      return;
    }

    // 4. Redirect to the new map page
    router.push(`/dashboard/map/${newMap.id}`);
    setIsCreateMapModalOpen(false); // Close modal after creation
  };

  return (
    <>
      <button
        onClick={() => setIsCreateMapModalOpen(true)} // Open modal on button click
        className="px-4 py-2 bg-slate-800 text-white rounded-md font-semibold text-sm hover:bg-slate-700 flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>このテンプレートから作成</span>
      </button>

      <CreateMapModal
        isOpen={isCreateMapModalOpen}
        onClose={() => setIsCreateMapModalOpen(false)}
        onCreateMap={handleCreateFromTemplate}
      />
    </>
  );
}