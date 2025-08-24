'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import FolderTree from '@/components/FolderTree';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);

  const handleNewFolder = async () => {
    const folderName = window.prompt('新しいフォルダの名前を入力してください:');
    if (!folderName) {
      return;
    }

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
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-slate-200">
        <Link href="/dashboard" className="text-xl font-bold text-slate-800">ストラクトノート</Link>
      </div>
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={handleNewFolder}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-300 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>新しいフォルダ</span>
        </button>
      </div>
      <FolderTree refreshTrigger={folderRefreshKey} />
    </aside>
  );
}
