'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { NodeData } from '@/app/dashboard/map/[mapId]/page';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

const NODE_TYPES = [
  'origin', 'purpose', 'vision', 'value',
  'strategy', 'action', 'obstacle', 'resource'
];

interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: NodeData) => Promise<void>; // onSave is now async
  nodeData: NodeData | null;
}

export default function NodeEditModal({ isOpen, onClose, onSave, nodeData }: NodeEditModalProps) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (nodeData) {
      setTitle(nodeData.title);
      setDetails(nodeData.details || '');
    } else {
      setTitle('');
      setDetails('');
    }
  }, [nodeData]);

  if (!isOpen || !nodeData) return null;

  const handleSave = () => {
    onSave({ ...nodeData, title, details });
  };

  const handleCreateChildMap = async () => {
    // 1. Save the current node's changes first
    await onSave({ ...nodeData, title, details }); // Await the save operation

    const newMapTitle = window.prompt('新しい子マップのタイトルを入力してください:');
    if (!newMapTitle) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('エラー: ユーザーが認証されていません。');
      return;
    }

    // 2. Create the new child map
    const { data: newMap, error: mapError } = await supabase
      .from('maps')
      .insert({ title: newMapTitle, user_id: user.id, folder_id: null }) // child maps are not in folders directly
      .select()
      .single();

    if (mapError || !newMap) {
      alert(`子マップの作成に失敗しました: ${mapError?.message}`);
      return;
    }

    // 3. Create the 8 default nodes for the new child map
    const nodesToInsert = NODE_TYPES.map(nodeType => ({
      map_id: newMap.id,
      node_type: nodeType,
      title: nodeType.charAt(0).toUpperCase() + nodeType.slice(1), // Capitalize first letter
      details: ''
    }));

    const { error: nodesError } = await supabase.from('nodes').insert(nodesToInsert);

    if (nodesError) {
      alert(`子マップのノード作成に失敗しました: ${nodesError.message}`);
      // TODO: Consider rolling back map creation if nodes fail
      return;
    }

    // 4. Update the parent node's child_map_id
    const { error: updateNodeError } = await supabase
      .from('nodes')
      .update({ child_map_id: newMap.id })
      .eq('id', nodeData.id);

    if (updateNodeError) {
      alert(`親ノードの更新に失敗しました: ${updateNodeError.message}`);
      return;
    }

    // 5. Redirect to the new child map page
    router.push(`/dashboard/map/${newMap.id}`);
    onClose(); // Close the modal after redirection
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="relative bg-white rounded-xl shadow-2xl w-11/12 max-w-2xl m-4 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale">
        <div className="p-6 sm:p-8">
          <div className="flex items-center space-x-3 w-full mb-4">
            {/* TODO: Add node type icon */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold p-1 w-full bg-transparent focus:bg-slate-100 rounded-md outline-none"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="node-details" className="block text-sm font-medium text-slate-600 mb-1">詳細</label>
              <textarea
                id="node-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full h-48 p-3 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition"
                placeholder="ここに詳細な内容を入力します..."
              />
            </div>
            {nodeData.child_map_id ? (
                <Link href={`/dashboard/map/${nodeData.child_map_id}`} className="inline-flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-900">
                    <Plus className="w-4 h-4" />
                    <span>子マップを開く</span>
                </Link>
            ) : (
                <button onClick={handleCreateChildMap} className="inline-flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                    <Plus className="w-4 h-4" />
                    <span>このノードから新しいマップを作成する</span>
                </button>
            )}
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-5 py-2 bg-white text-slate-700 border border-slate-300 rounded-md font-semibold text-sm hover:bg-slate-100">
            キャンセル
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-slate-800 text-white rounded-md font-semibold text-sm hover:bg-slate-700">
            保存する
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.3s forwards; }
      `}</style>
    </div>
  );
}
