'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import FolderTree from '@/components/FolderTree';
import { createClient } from '@/lib/supabase/client'; // Updated import
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const supabase = createClient(); // Initialize Supabase client

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

    // For now, new folders are created at the root level.
    // TODO: Implement creating sub-folders.
    const { error } = await supabase
      .from('folders')
      .insert({ name: folderName, user_id: user.id, parent_folder_id: null });

    if (error) {
      alert(`エラー: ${error.message}`);
    } else {
      // router.refresh() is a soft refresh that re-fetches data for Server Components.
      router.refresh();
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-slate-200">
        <Link href="/dashboard" className="text-xl font-bold text-slate-800">StructNote</Link>
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
      <FolderTree />
    </aside>
  );
}