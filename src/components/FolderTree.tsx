'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2, GripVertical } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

export type FolderType = {
  id: string;
  name: string;
  parent_folder_id: string | null;
  children?: FolderType[];
};

const buildTree = (folders: FolderType[]): FolderType[] => {
  const folderMap = new Map(folders.map(f => [f.id, { ...f, children: [] }]));
  const tree: FolderType[] = [];
  folders.forEach(folder => {
    const mappedFolder = folderMap.get(folder.id)!;
    if (folder.parent_folder_id && folderMap.has(folder.parent_folder_id)) {
      folderMap.get(folder.parent_folder_id)!.children!.push(mappedFolder);
    } else {
      tree.push(mappedFolder);
    }
  });
  return tree;
};

const FolderItem = ({ folder, level, isExpanded, onToggleExpand, expandedFolderIds }: { folder: FolderType; level: number; isExpanded: boolean; onToggleExpand: (folderId: string) => void; expandedFolderIds: Set<string> }) => {
  const hasChildren = folder.children && folder.children.length > 0;
  console.log(`FolderItem: ${folder.name} (ID: ${folder.id}), hasChildren: ${hasChildren}, children:`, folder.children, `isExpanded prop: ${isExpanded}`); // Add isExpanded prop log
  console.log(`FolderItem: ${folder.name} (ID: ${folder.id}), isExpanded for children rendering check: ${isExpanded}`); // Add this log
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isActive = pathname === `/dashboard/folder/${folder.id}`;

  const style = undefined; // No transform

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt('新しいフォルダ名を入力してください:', folder.name);
    if (!newName || newName === folder.name) return;

    const { error } = await supabase.from('folders').update({ name: newName }).eq('id', folder.id);
    if (error) {
      alert(`エラー: ${error.message}`);
    } else {
      router.refresh();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`本当に「${folder.name}」を削除しますか？\nこの操作は元に戻せません。`)) {
      const { error } = await supabase.from('folders').delete().eq('id', folder.id);
      if (error) {
        alert(`エラー: ${error.message}`);
      } else {
        if (isActive) {
          router.push('/dashboard');
        }
        router.refresh();
      }
    }
  };

  return (
    <div>
      <div className={`group flex items-center pr-2 rounded-md w-full text-left ${isActive ? 'bg-slate-200 font-semibold text-slate-800' : 'hover:bg-slate-100'}`}>
        <div
          className="p-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggleExpand(folder.id);
            }
          }}
          style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
        <Link href={`/dashboard/folder/${folder.id}`} className="flex items-center space-x-2 flex-grow truncate py-2 cursor-pointer">
          <Folder className="w-5 h-5" />
          <span className="flex-grow truncate">{folder.name}</span>
        </Link>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleRename} className="p-1 rounded hover:bg-slate-300">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={handleDelete} className="p-1 rounded hover:bg-slate-300">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="space-y-1 mt-1">
          {folder.children!.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              isExpanded={expandedFolderIds.has(child.id)}
              onToggleExpand={onToggleExpand}
              expandedFolderIds={expandedFolderIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FolderTree({ refreshTrigger }: { refreshTrigger: number }) { // Added refreshTrigger prop
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set()); // New state
  const supabase = createClient();

  const handleToggleExpand = (folderId: string) => {
    console.log('Toggling expand for folder:', folderId); // Add this log
    setExpandedFolderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
        console.log('Deleting folderId:', folderId, 'from set. Prev:', prev, 'New:', newSet); // Add this log
      } else {
        newSet.add(folderId);
        console.log('Adding folderId:', folderId, 'to set. Prev:', prev, 'New:', newSet); // Add this log
      }
      console.log('New expandedFolderIds before return:', newSet); // Add this log
      return newSet;
    });
  };

  useEffect(() => {
    const fetchFolders = async () => {
      console.log('Fetching folders...');
      const { data, error } = await supabase
        .from('folders')
        .select('id, name, parent_folder_id')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching folders:', error);
        setError('フォルダの読み込みに失敗しました。');
        console.log('Supabase fetch error:', error);
      } else {
        setFolders(data);
        console.log('Folders fetched:', data);

        // Initialize expandedFolderIds to include all folder IDs by default
        const allFolderIds = new Set<string>();
        data.forEach((folder: FolderType) => {
          allFolderIds.add(folder.id);
        });
        setExpandedFolderIds(allFolderIds);
      }
      setLoading(false);
    };

    // Removed real-time channel subscription
    // const channel = supabase.channel('realtime folders').on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, () => {
    //   console.log('Realtime change detected, refetching folders...');
    //   fetchFolders();
    // }).subscribe();

    fetchFolders();

    // Removed channel cleanup
    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [refreshTrigger]); // Added refreshTrigger to dependency array

  const isDescendant = (targetId: string, draggedId: string, tree: FolderType[]): boolean => {
    let draggedFolder: FolderType | undefined;

    // Find the dragged folder in the tree
    const findFolderInTree = (folders: FolderType[]): FolderType | undefined => {
      for (const folder of folders) {
        if (folder.id === draggedId) {
          return folder;
        }
        if (folder.children) {
          const found = findFolderInTree(folder.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    draggedFolder = findFolderInTree(tree);

    if (!draggedFolder) return false;

    // Now check if targetId is a descendant of draggedFolder
    const queue: FolderType[] = [...(draggedFolder.children || [])];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current && current.id === targetId) {
        return true;
      }
      if (current && current.children) {
        queue.push(...current.children);
      }
    }
    return false;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag ended. Active:', active.id, 'Over:', over?.id); // Add this log

    // Add this check: ensure a valid draggable item was active
    if (!active.data.current) {
      console.log('Not a valid drag operation (active.data.current is missing).'); // Add this log
      return; // Not a valid drag operation
    }

    if (over && active.id !== over.id) {
      console.log('Attempting to move folder:', active.id, 'to parent:', over.id); // Add this log
      // Prevent dropping a folder into itself or its descendants
      if (isDescendant(over.id as string, active.id as string, folderTree)) {
        alert('エラー: フォルダを自身またはその子孫に移動することはできません。');
        console.log('Drag prevented: Descendant check failed.'); // Add this log
        return;
      }

      const { error } = await supabase
        .from('folders')
        .update({ parent_folder_id: over.id as string })
        .eq('id', active.id as string);
      if (error) {
        alert(`エラー: ${error.message}`);
        console.error('Supabase update error:', error);
      } else {
        console.log('Folder moved successfully. Refreshing router.'); // Add this log
        router.refresh(); // Refresh after successful drag-and-drop
      }
    } else {
      console.log('Drag not resulting in a move (over is null or active.id === over.id).'); // Add this log
    }
  };

  const folderTree = useMemo(() => buildTree(folders), [folders]);

  if (loading) {
    return <div className="p-4"><p className="text-sm text-slate-500">読み込み中...</p></div>;
  }

  if (error) {
    return <div className="p-4"><p className="text-sm text-red-500">{error}</p></div>;
  }

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {folderTree.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-slate-500">フォルダがありません。</p>
          </div>
        ) : (
          folderTree.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              level={0}
              isExpanded={expandedFolderIds.has(folder.id)}
              onToggleExpand={handleToggleExpand}
              expandedFolderIds={expandedFolderIds}
            />
          ))
        )}
      </nav>
    </DndContext>
  );
}
