'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext'; // Import useUser
import { User, Home, LogOut, Settings, User as UserIcon, Menu } from 'lucide-react';

type Folder = {
  id: string;
  name: string;
  parent_folder_id: string | null;
};

export default function Header({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (isOpen: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const supabase = createClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { displayName } = useUser(); // Get displayName from context

  useEffect(() => {
    const fetchFolders = async () => {
      const { data } = await supabase.from('folders').select('id, name, parent_folder_id');
      if (data) {
        setAllFolders(data);
      }
    };
    fetchFolders();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; href: string }[]>([]);

  useEffect(() => {
    const calculateBreadcrumbs = async () => {
      if (allFolders.length === 0) {
        setBreadcrumbs([{ name: 'ホーム', href: '/dashboard' }]);
        return;
      }

      const pathParts = pathname.split('/').filter(p => p);
      const crumbs: { name: string; href: string }[] = [{ name: 'ホーム', href: '/dashboard' }];

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
      if (pathParts[1] === 'map' && pathParts[2]) {
        const mapId = pathParts[2];
        const { data: map, error } = await supabase.from('maps').select('id, title, folder_id').eq('id', mapId).single();
        if (error || !map) {
          console.error('Error fetching map for breadcrumb:', error);
          setBreadcrumbs(crumbs);
          return;
        }

        const mapCrumb = { name: map.title, href: `/dashboard/map/${map.id}` };
        let currentFolderId: string | null = map.folder_id;
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
        crumbs.push(mapCrumb);
      }

      setBreadcrumbs(crumbs);
    };

    calculateBreadcrumbs();
  }, [pathname, allFolders, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <button
        className="md:hidden p-2 rounded-md hover:bg-slate-100"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="w-6 h-6 text-slate-500" />
      </button>

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
      <div className="relative flex items-center space-x-4" ref={dropdownRef}>
        {displayName && <span className="text-sm font-medium text-slate-700 mr-2">{displayName}</span>}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <User className="w-6 h-6 text-slate-500" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
            <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}>
              <UserIcon className="w-4 h-4 mr-2" />
              マイプロフィール
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
