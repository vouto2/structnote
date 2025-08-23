'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
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

const FolderItem = ({ folder, level }: { folder: FolderType; level: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isActive = pathname === `/dashboard/folder/${folder.id}`;

  const { attributes, listeners, setNodeRef: draggableRef, transform } = useDraggable({ id: folder.id });
  const { setNodeRef: droppableRef, isOver } = useDroppable({ id: folder.id });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 100 } : undefined;

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
    <div ref={draggableRef} style={style} {...attributes} {...listeners}>
      <div ref={droppableRef} className={`group flex items-center pr-2 rounded-md w-full text-left ${isActive ? 'bg-slate-200 font-semibold text-slate-800' : 'hover:bg-slate-100'} ${isOver ? 'bg-blue-100 outline-blue-500 outline' : ''}`}>
        <div
          className="p-1 cursor-pointer"
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
          style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
        <Link href={`/dashboard/folder/${folder.id}`} className="flex items-center space-x-2 flex-grow truncate py-2">
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
            <FolderItem key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FolderTree() {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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
        console.log('Supabase fetch error:', error); // Log the Supabase error object
      } else {
        setFolders(data);
        console.log('Folders fetched:', data); // Log the fetched data
      }
      setLoading(false);
    };

    const channel = supabase.channel('realtime folders').on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, () => {
      console.log('Realtime change detected, refetching folders...');
      fetchFolders();
    }).subscribe();

    fetchFolders();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const { error } = await supabase
        .from('folders')
        .update({ parent_folder_id: over.id as string })
        .eq('id', active.id as string);
      if (error) alert(`Error: ${error.message}`);
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
            <FolderItem key={folder.id} folder={folder} level={0} />
          ))
        )}
      </nav>
    </DndContext>
  );
}