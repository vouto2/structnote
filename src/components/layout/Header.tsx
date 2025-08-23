'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'; // Updated import
import { Bell, User, Home } from 'lucide-react';

type Folder = {
  id: string;
  name: string;
  parent_folder_id: string | null;
};

export default function Header() {
  const pathname = usePathname();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const supabase = createClient(); // Initialize Supabase client

  useEffect(() => {
    const fetchFolders = async () => {
      const { data } = await supabase.from('folders').select('id, name, parent_folder_id');
      if (data) {
        setAllFolders(data);
      }
    };
    fetchFolders();
  }, []);

  const breadcrumbs = useMemo(() => {
    if (allFolders.length === 0) return [];

    const pathParts = pathname.split('/').filter(p => p);
    const crumbs: { name: string; href: string }[] = [{ name: 'Home', href: '/dashboard' }];

    if (pathParts[1] === 'folder' && pathParts[2]) {
      let currentFolderId: string | null = pathParts[2];
      const folderMap = new Map(allFolders.map(f => [f.id, f]));
      const path: Folder[] = [];
      
      while (currentFolderId) {
        const folder = folderMap.get(currentFolderId);
        if (folder) {
          path.unshift(folder);
          currentFolderId = folder.parent_folder_id;
        } else {
          currentFolderId = null;
        }
      }
      path.forEach(folder => {
        crumbs.push({ name: folder.name, href: `/dashboard/folder/${folder.id}` });
      });
    }
    // TODO: Add breadcrumbs for map pages as well

    return crumbs;
  }, [pathname, allFolders]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && <span>/</span>}
            <Link href={crumb.href} className={`flex items-center space-x-1 hover:text-slate-700 ${index === breadcrumbs.length - 1 ? 'font-semibold text-slate-700' : ''}`}>
              {index === 0 ? <Home className="w-4 h-4" /> : null}
              <span>{crumb.name}</span>
            </Link>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-slate-100">
          <Bell className="w-6 h-6 text-slate-500" />
        </button>
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
          <User className="w-6 h-6 text-slate-500" />
        </div>
      </div>
    </header>
  );
}