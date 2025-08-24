'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { NodeData, MapData } from '@/app/dashboard/map/[mapId]/page';
import CreateMapFromTemplateButton from './CreateMapFromTemplateButton';
import MapEditor from './MapEditor'; // Import MapEditor

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateTitle: string;
  folderId: string | null; // Added folderId
}

export default function TemplatePreviewModal({ isOpen, onClose, templateId, templateTitle, folderId }: TemplatePreviewModalProps) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  console.log('TemplatePreviewModal: isOpen', isOpen);

  useEffect(() => {
    if (!isOpen) {
      console.log('TemplatePreviewModal: Modal is closed, not fetching.');
      return;
    }

    const fetchNodes = async () => {
      setLoading(true);
      setError(null);
      console.log('TemplatePreviewModal: Fetching nodes for templateId:', templateId);
      const { data, error } = await supabase
        .from('nodes')
        .select('id, node_type, title, details')
        .eq('map_id', templateId);

      if (error) {
        console.error('TemplatePreviewModal: Error fetching template nodes:', error);
        setError('テンプレートノードの読み込みに失敗しました。');
      } else {
        setNodes(data);
        console.log('TemplatePreviewModal: Nodes fetched:', data);
      }
      setLoading(false);
    };

    fetchNodes();
  }, [isOpen, templateId]);

  if (!isOpen) return null;

  // Construct MapData for MapEditor
  const initialMapData: MapData = {
    id: templateId,
    title: templateTitle,
    nodes: nodes,
  };

  console.log('TemplatePreviewModal: Nodes passed to MapEditor:', initialMapData.nodes); // Log nodes before passing

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className={`relative bg-white rounded-xl shadow-2xl w-11/12 max-w-5xl m-4 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ height: '90vh' }}>
        <div className="h-full flex flex-col">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4 text-center">{templateTitle} のプレビュー</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 sm:px-8">
            {loading ? (
              <p className="text-center">読み込み中...</p>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              <div>
                <MapEditor initialMapData={initialMapData} readOnly={true} />
              </div>
            )}
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end items-center space-x-3">
            <button onClick={onClose} className="px-5 py-2 bg-white text-slate-700 border border-slate-300 rounded-md font-semibold text-sm hover:bg-slate-100">
              キャンセル
            </button>
            <CreateMapFromTemplateButton templateId={templateId} templateTitle={templateTitle} folderId={folderId} />
          </div>
        </div>
      </div>
    </div>
  );
}
