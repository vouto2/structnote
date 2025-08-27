'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';

// Types
type FolderItem = {
  id: string;
  name: string;
  parent_folder_id: string | null;
  children?: FolderItem[];
};

// Recursive component to display the folder tree
const FolderTreeItem = ({ folder, level, onSelect, selectedFolderId, expandedFolders, onToggleExpand, currentFolderId }: {
  folder: FolderItem;
  level: number;
  onSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  onToggleExpand: (folderId: string) => void;
  currentFolderId?: string | null;
}) => {
  const isSelected = selectedFolderId === folder.id;
  const isExpanded = expandedFolders.has(folder.id);
  const hasChildren = folder.children && folder.children.length > 0;
  const isCurrentLocation = folder.id === currentFolderId;

  return (
    <>
      <div
        onClick={() => !isCurrentLocation && onSelect(folder.id)}
        className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${isCurrentLocation ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : isSelected ? 'bg-blue-100' : 'hover:bg-slate-100'}`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            className="p-1 rounded-full hover:bg-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(folder.id);
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-7" /> // Placeholder for alignment
        )}
        <Folder className={`w-5 h-5 ${isCurrentLocation ? 'text-slate-400' : 'text-slate-600'}`} />
        <span className="truncate">{folder.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div className="space-y-1">
          {folder.children!.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              onSelect={onSelect}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              currentFolderId={currentFolderId}
            />
          ))}
        </div>
      )}
    </>
  );
};

interface MoveToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (destinationFolderId: string | null) => void;
  movingItemName: string;
  currentFolderId?: string | null;
}

export default function MoveToModal({ isOpen, onClose, onMove, movingItemName, currentFolderId }: MoveToModalProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    const fetchFolders = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('folders').select('id, name, parent_folder_id');
      if (error) {
        console.error('Error fetching folders:', error);
        setFolders([]);
      } else {
        setFolders(data || []);
        // Initially expand all folders to show the structure
        setExpandedFolders(new Set(data.map(f => f.id)));
      }
      setLoading(false);
    };

    fetchFolders();
  }, [isOpen, supabase]);

  const folderTree = useMemo(() => {
    const itemMap = new Map(folders.map(f => [f.id, { ...f, children: [] }]));
    const tree: FolderItem[] = [];
    folders.forEach(folder => {
      const mappedItem = itemMap.get(folder.id)!;
      if (folder.parent_folder_id && itemMap.has(folder.parent_folder_id)) {
        itemMap.get(folder.parent_folder_id)!.children!.push(mappedItem);
      } else {
        tree.push(mappedItem);
      }
    });
    return tree;
  }, [folders]);

  const handleToggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleMove = () => {
    if (selectedFolderId !== undefined) {
      onMove(selectedFolderId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-lg flex flex-col" style={{ height: '70vh' }}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">「{movingItemName}」の移動先を選択</h2>
        </div>
        <div className="p-4 flex-grow overflow-y-auto">
          {loading ? (
            <p>読み込み中...</p>
          ) : (
            <div className="space-y-1">
              {/* Root option */}
              <div
                onClick={() => setSelectedFolderId(null)}
                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${selectedFolderId === null ? 'bg-blue-100' : 'hover:bg-slate-100'}`}
              >
                <div className="w-7" />
                <Folder className="w-5 h-5 text-slate-600" />
                <span>ホーム (ルート)</span>
              </div>
              {folderTree.map(folder => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  onSelect={setSelectedFolderId}
                  selectedFolderId={selectedFolderId}
                  expandedFolders={expandedFolders}
                  onToggleExpand={handleToggleExpand}
                  currentFolderId={currentFolderId}
                />
              ))}
            </div>
          )}
        </div>
        <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-5 py-2 bg-white text-slate-700 border border-slate-300 rounded-md font-semibold text-sm hover:bg-slate-100">
            キャンセル
          </button>
          <button
            onClick={handleMove}
            disabled={selectedFolderId === undefined || selectedFolderId === currentFolderId}
            className="px-5 py-2 bg-slate-800 text-white rounded-md font-semibold text-sm hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            ここに移動
          </button>
        </div>
      </div>
    </div>
  );
}
