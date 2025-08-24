'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import FolderTree from '@/components/FolderTree';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import CreateFolderModal from '../CreateFolderModal';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (isOpen: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false); // New state for modal visibility

  const handleNewFolder = async (folderName: string) => { // Modified to accept folderName as argument
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('エラー: ユーザーが認証されていません。');
      return;
    }

    let parentFolderId: string | null = null;
    const pathParts = pathname.split('/').filter(p => p);

    console.log('Sidebar: pathname:', pathname); // Log pathname
    console.log('Sidebar: pathParts:', pathParts); // Log pathParts

    if (pathParts[0] === 'dashboard' && pathParts[1] === 'folder' && pathParts[2]) {
      parentFolderId = pathParts[2];
    }
    console.log('Sidebar: determined parentFolderId:', parentFolderId); // Log determined parentFolderId

    const { error } = await supabase
      .from('folders')
      .insert({ name: folderName, user_id: user.id, parent_folder_id: parentFolderId });

    if (error) {
      alert(`エラー: ${error.message}`);
    } else {
      setFolderRefreshKey(prev => prev + 1);
    }
    setIsCreateFolderModalOpen(false); // Close modal after creation
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex`} // Hide on mobile by default, show on md and up
    >
      <div className="h-16 flex items-center px-4 border-b border-slate-200">
        <Link href="/dashboard" className="text-xl font-bold text-slate-800">ストラクトノート</Link>
      </div>
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={() => setIsCreateFolderModalOpen(true)} // Open modal on button click
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-300 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>新しいフォルダ</span>
        </button>
      </div>
      <FolderTree refreshTrigger={folderRefreshKey} />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreateFolder={handleNewFolder}
      />
    </aside>
  );
}
