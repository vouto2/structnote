'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Folder, File, ChevronRight, ChevronDown, MoreVertical, Pencil, Trash2, Move } from 'lucide-react';
import { DndContext, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import RenameModal from './RenameModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import MoveToModal from './MoveToModal';

// Combined type for both folders and maps
export type TreeItemType = {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'folder' | 'map';
  children?: TreeItemType[];
};

const buildTree = (items: TreeItemType[]): TreeItemType[] => {
  const itemMap = new Map(items.map(i => [i.id, { ...i, children: [] }]));
  const tree: TreeItemType[] = [];
  items.forEach(item => {
    const mappedItem = itemMap.get(item.id)!;
    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id)!;
      if (parent.type === 'folder') {
        parent.children!.push(mappedItem);
      }
    } else {
      tree.push(mappedItem);
    }
  });
  return tree;
};

const TreeItemDisplay = ({ item, level, isExpanded, onToggleExpand, expandedItemIds, onRenameClick, onDeleteClick, onMoveClick }: { 
  item: TreeItemType; 
  level: number; 
  isExpanded: boolean; 
  onToggleExpand: (itemId: string) => void; 
  expandedItemIds: Set<string>; 
  onRenameClick: (item: TreeItemType) => void; 
  onDeleteClick: (item: TreeItemType) => void; 
  onMoveClick: (item: TreeItemType) => void;
}) => {
  const isFolder = item.type === 'folder';
  const hasChildren = isFolder && item.children && item.children.length > 0;
  const pathname = usePathname();
  const isActive = pathname === (isFolder ? `/dashboard/folder/${item.id}` : `/dashboard/map/${item.id}`);
  const linkHref = isFolder ? `/dashboard/folder/${item.id}` : `/dashboard/map/${item.id}`;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dnd-kit hooks
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({ id: item.id, data: { type: item.type } });
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: item.id, disabled: !isFolder });

  const setCombinedNodeRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    if (isFolder) setDroppableNodeRef(node);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const style = {
    opacity: isDragging ? 0.4 : 1,
    boxShadow: isOver ? '0 0 0 2px #3b82f6' : undefined, // Visual feedback for droppable
  };

  return (
    <div>
      <div 
        ref={setCombinedNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners} 
        className={`group flex items-center pr-2 rounded-md w-full text-left ${isActive ? 'bg-slate-200 font-semibold text-slate-800' : 'hover:bg-slate-100'}`}
      >
        <div
          className="p-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggleExpand(item.id);
            }
          }}
          style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        >
          {isFolder ? (
            hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
        <Link href={linkHref} className="flex items-center space-x-2 flex-grow truncate py-2 cursor-pointer">
          {isFolder ? <Folder className="w-5 h-5" /> : <File className="w-5 h-5" />}
          <span className="flex-grow truncate">{item.name}</span>
        </Link>
        <div className="relative" ref={menuRef}>
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsMenuOpen(!isMenuOpen); }} className="p-1 rounded hover:bg-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg py-1 z-20 border border-slate-200">
              <button onClick={(e) => { e.preventDefault(); onRenameClick(item); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                <Pencil className="w-4 h-4 mr-2" />
                名前の変更
              </button>
              <button onClick={(e) => { e.preventDefault(); onMoveClick(item); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                <Move className="w-4 h-4 mr-2" />
                移動
              </button>
              <button onClick={(e) => { e.preventDefault(); onDeleteClick(item); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-slate-100">
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </button>
            </div>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="space-y-1 mt-1">
          {item.children!.map(child => (
            <TreeItemDisplay
              key={child.id}
              item={child}
              level={level + 1}
              isExpanded={expandedItemIds.has(child.id)}
              onToggleExpand={onToggleExpand}
              expandedItemIds={expandedItemIds}
              onRenameClick={onRenameClick}
              onDeleteClick={onDeleteClick}
              onMoveClick={onMoveClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FolderTree({ refreshTrigger }: { refreshTrigger: number }) {
  const [treeItems, setTreeItems] = useState<TreeItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  
  const [selectedItem, setSelectedItem] = useState<TreeItemType | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveToModalOpen, setIsMoveToModalOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleToggleExpand = (itemId: string) => {
    setExpandedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data: folders, error: foldersError } = await supabase.from('folders').select('id, name, parent_folder_id');
      if (foldersError) throw foldersError;

      const { data: maps, error: mapsError } = await supabase.from('maps').select('id, title, folder_id').eq('is_template', false);
      if (mapsError) throw mapsError;

      const combinedItems: TreeItemType[] = [
        ...folders.map(f => ({ ...f, parent_id: f.parent_folder_id, type: 'folder' as const })),
        ...maps.map(m => ({ id: m.id, name: m.title, parent_id: m.folder_id, type: 'map' as const }))
      ];
      
      setTreeItems(combinedItems);
      const allFolderIds = new Set<string>(folders.map(f => f.id));
      setExpandedItemIds(allFolderIds);

    } catch (err: any) {
      setError('データの読み込みに失敗しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('FolderTree: useEffect triggered, refreshTrigger:', refreshTrigger);
    fetchItems();
  }, [refreshTrigger, supabase]);

  const handleRenameClick = (item: TreeItemType) => { setSelectedItem(item); setIsRenameModalOpen(true); };
  const handleDeleteClick = (item: TreeItemType) => { setSelectedItem(item); setIsDeleteModalOpen(true); };
  const handleMoveClick = (item: TreeItemType) => { setSelectedItem(item); setIsMoveToModalOpen(true); };

  const handleRenameSubmit = async (newName: string) => {
    if (!selectedItem) return;
    const fromTable = selectedItem.type === 'folder' ? 'folders' : 'maps';
    const nameColumn = selectedItem.type === 'folder' ? 'name' : 'title';
    const { error } = await supabase.from(fromTable).update({ [nameColumn]: newName }).eq('id', selectedItem.id);
    if (error) {
      alert(`エラー: ${error.message}`);
    } else {
      setTreeItems(prevItems => prevItems.map(item => item.id === selectedItem.id ? { ...item, name: newName } : item));
    }
    setSelectedItem(null); setIsRenameModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    const fromTable = selectedItem.type === 'folder' ? 'folders' : 'maps';
    const { error } = await supabase.from(fromTable).delete().eq('id', selectedItem.id);
    if (error) {
      alert(`エラー: ${error.message}`);
    } else {
      setTreeItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
    }
    setSelectedItem(null); setIsDeleteModalOpen(false);
  };

  const handleMoveConfirm = async (destinationFolderId: string | null) => {
    if (!selectedItem) return;
    const fromTable = selectedItem.type === 'folder' ? 'folders' : 'maps';
    const parentIdColumn = selectedItem.type === 'folder' ? 'parent_folder_id' : 'folder_id';
    const { error } = await supabase.from(fromTable).update({ [parentIdColumn]: destinationFolderId }).eq('id', selectedItem.id);
    if (error) {
        alert(`エラー: ${error.message}`);
    } else {
        // After successful move, re-fetch all items to update the tree
        fetchItems();
    }
    setSelectedItem(null); setIsMoveToModalOpen(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeItem = treeItems.find(i => i.id === active.id);
      const overItem = treeItems.find(i => i.id === over.id);
      if (!activeItem || !overItem) return;
      if (overItem.type !== 'folder') {
        alert('フォルダの中にのみ移動できます。');
        return;
      }
      const fromTable = activeItem.type === 'folder' ? 'folders' : 'maps';
      const parentIdColumn = activeItem.type === 'folder' ? 'parent_folder_id' : 'folder_id';
      const { error } = await supabase.from(fromTable).update({ [parentIdColumn]: over.id as string }).eq('id', active.id as string);
      if (error) {
        alert(`エラー: ${error.message}`);
      } else {
        setTreeItems(prevItems => prevItems.map(item => item.id === active.id ? { ...item, parent_id: over.id as string } : item));
        router.refresh(); // To reload folder content if active
      }
    }
  };

  const tree = useMemo(() => buildTree(treeItems), [treeItems]);

  if (loading) return <div className="p-4"><p className="text-sm text-slate-500">読み込み中...</p></div>;
  if (error) return <div className="p-4"><p className="text-sm text-red-500">{error}</p></div>;

  return (
    <>
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {tree.length === 0 ? (
            <div className="p-4 text-center"><p className="text-sm text-slate-500">アイテムがありません。</p></div>
          ) : (
            tree.map((item) => (
              <TreeItemDisplay
                key={item.id}
                item={item}
                level={0}
                isExpanded={expandedItemIds.has(item.id)}
                onToggleExpand={handleToggleExpand}
                expandedItemIds={expandedItemIds}
                onRenameClick={handleRenameClick}
                onDeleteClick={handleDeleteClick}
                onMoveClick={handleMoveClick}
              />
            ))
          )}
        </nav>
      </DndContext>
      {selectedItem && <RenameModal isOpen={isRenameModalOpen} onClose={() => setSelectedItem(null)} onRename={handleRenameSubmit} currentItemName={selectedItem.name} itemType={selectedItem.type === 'folder' ? 'フォルダ' : 'マップ'} />}
      {selectedItem && <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setSelectedItem(null)} onConfirm={handleDeleteConfirm} itemName={selectedItem.name} itemType={selectedItem.type === 'folder' ? 'フォルダ' : 'マップ'} />}
      {selectedItem && <MoveToModal isOpen={isMoveToModalOpen} onClose={() => setSelectedItem(null)} onMove={handleMoveConfirm} movingItemName={selectedItem.name} currentFolderId={selectedItem.parent_id} />}
    </>
  );
}
