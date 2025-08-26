'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Folder, FileText, FilePlus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import CreateNewMapButton from '@/components/CreateNewMapButton';
import RenameModal from '@/components/RenameModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

// TODO: Define these types globally or move to a types file
type FolderType = {
  id: string;
  name: string;
  type: 'folder';
};

type MapType = {
  id: string;
  title: string;
  updated_at: string;
  type: 'map';
};

type ItemType = FolderType | MapType;

const ItemCard = ({ item, onRename, onDelete }: { item: ItemType, onRename: (item: ItemType) => void, onDelete: (item: ItemType) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFolder = item.type === 'folder';
  const linkHref = isFolder ? `/dashboard/folder/${item.id}` : `/dashboard/map/${item.id}`;
  const name = isFolder ? item.name : item.title;

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between hover:shadow-md hover:border-slate-300 transition group">
      <Link href={linkHref} className="flex items-center space-x-4 flex-grow truncate">
        <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${isFolder ? 'bg-sky-100' : 'bg-slate-100'}`}>
          {isFolder ? <Folder className="w-6 h-6 text-sky-600" /> : <FileText className="w-6 h-6 text-slate-500" />}
        </div>
        <div className="truncate">
          <h3 className="font-semibold text-slate-800 truncate">{name}</h3>
          {!isFolder && (
            <p className="text-sm text-slate-500">
              {new Date(item.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </Link>
      <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsMenuOpen(!isMenuOpen); }} className="p-2 rounded-full hover:bg-slate-200 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
              <MoreVertical className="w-5 h-5 text-slate-600" />
          </button>
          {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg py-1 z-20 border border-slate-200">
                  <button onClick={(e) => { e.preventDefault(); onRename(item); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      <Pencil className="w-4 h-4 mr-2" />
                      名前の変更
                  </button>
                  <button onClick={(e) => { e.preventDefault(); onDelete(item); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-slate-100">
                      <Trash2 className="w-4 h-4 mr-2" />
                      削除
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [rootItems, setRootItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('id, name')
        .is('parent_folder_id', null)
        .order('name');

      const { data: maps, error: mapsError } = await supabase
        .from('maps')
        .select('id, title, updated_at')
        .is('folder_id', null)
        .eq('is_template', false)
        .order('title');

      if (foldersError || mapsError) {
        console.error('Error fetching data:', foldersError || mapsError);
        setLoading(false);
        return;
      }

      const combinedItems: ItemType[] = [
        ...(folders?.map(f => ({ ...f, type: 'folder' as const })) || []),
        ...(maps?.map(m => ({ ...m, type: 'map' as const })) || []),
      ];

      setRootItems(combinedItems);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleRenameClick = (item: ItemType) => {
    setSelectedItem(item);
    setIsRenameModalOpen(true);
  };

  const handleDeleteClick = (item: ItemType) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!selectedItem) return;

    const fromTable = selectedItem.type === 'folder' ? 'folders' : 'maps';
    const nameColumn = selectedItem.type === 'folder' ? 'name' : 'title';

    const { error } = await supabase
      .from(fromTable)
      .update({ [nameColumn]: newName })
      .eq('id', selectedItem.id);

    if (error) {
      alert(`エラー: ${error.message}`);
    } else {
      setRootItems(prevItems =>
        prevItems.map(item =>
          item.id === selectedItem.id
            ? { ...item, ...(item.type === 'folder' ? { name: newName } : { title: newName }) }
            : item
        )
      );
    }
    setSelectedItem(null);
    setIsRenameModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    const fromTable = selectedItem.type === 'folder' ? 'folders' : 'maps';
    const { error } = await supabase.from(fromTable).delete().eq('id', selectedItem.id);

    if (error) {
      alert(`エラー: ${error.message}`);
    } else {
      setRootItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
    }
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="w-full h-full p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">ホーム</h2>
          <div className="flex space-x-2">
            <Link href="/dashboard/templates" className="px-4 py-2 bg-slate-800 text-white rounded-md font-semibold text-sm hover:bg-slate-700 flex items-center space-x-2">
              <FilePlus className="w-4 h-4" />
              <span>テンプレートから作成</span>
            </Link>
            <CreateNewMapButton folderId={null} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-slate-500">読み込み中...</p></div>
        ) : rootItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">アイテムがありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rootItems.map((item) => (
              <ItemCard key={item.id} item={item} onRename={handleRenameClick} onDelete={handleDeleteClick} />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <RenameModal
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
          onRename={handleRenameSubmit}
          currentItemName={selectedItem.type === 'folder' ? selectedItem.name : selectedItem.title}
          itemType={selectedItem.type}
        />
      )}

      {selectedItem && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          itemName={selectedItem.type === 'folder' ? selectedItem.name : selectedItem.title}
          itemType={selectedItem.type}
        />
      )}
    </>
  );
}
