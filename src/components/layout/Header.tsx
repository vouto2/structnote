'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Home, LogOut, Settings, User as UserIcon } from 'lucide-react';

type Folder = {
  id: string;
  name: string;
  parent_folder_id: string | null;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const supabase = createClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null); // State for display name

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user display name:', profileError);
        } else {
          setUserDisplayName(profileData.display_name || user.email); // Use email as fallback
        }
      }
    };
    fetchUserData();

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

  const breadcrumbs = useMemo(() => {
    if (allFolders.length === 0) return [];

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
    // TODO: Add breadcrumbs for map pages as well

    return crumbs;
  }, [pathname, allFolders]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
      <div className="relative flex items-center space-x-4" ref={dropdownRef}> {/* Add ref to div */}
        {userDisplayName && <span className="text-sm font-medium text-slate-700 mr-2">{userDisplayName}</span>} {/* Display display_name */}
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
            {/* Removed Settings link */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
