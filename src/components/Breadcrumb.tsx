'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type BreadcrumbItem = {
  id: string;
  name: string;
  type: 'folder' | 'map';
  path: string;
};

interface BreadcrumbProps {
  currentMapId?: string;
  currentFolderId?: string;
}

export default function Breadcrumb({ currentMapId, currentFolderId }: BreadcrumbProps) {
  const [path, setPath] = useState<BreadcrumbItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchBreadcrumbPath = async () => {
      let currentId = currentMapId || currentFolderId;
      let currentType: 'folder' | 'map' = currentMapId ? 'map' : 'folder';
      const tempPath: BreadcrumbItem[] = [];

      while (currentId) {
        if (currentType === 'map') {
          const { data: map, error } = await supabase
            .from('maps')
            .select('id, title, folder_id')
            .eq('id', currentId)
            .single();
          if (error || !map) {
            console.error('Error fetching map for breadcrumb:', error);
            break;
          }
          tempPath.unshift({
            id: map.id,
            name: map.title,
            type: 'map',
            path: `/dashboard/map/${map.id}`,
          });
          currentId = map.folder_id;
          currentType = 'folder';
        } else { // currentType === 'folder'
          const { data: folder, error } = await supabase
            .from('folders')
            .select('id, name, parent_folder_id')
            .eq('id', currentId)
            .single();
          if (error || !folder) {
            console.error('Error fetching folder for breadcrumb:', error);
            break;
          }
          tempPath.unshift({
            id: folder.id,
            name: folder.name,
            type: 'folder',
            path: `/dashboard/folder/${folder.id}`,
          });
          currentId = folder.parent_folder_id;
          currentType = 'folder'; // Still a folder for the next iteration
        }
      }
      // Add Dashboard root
      tempPath.unshift({ id: 'dashboard', name: 'ダッシュボード', type: 'folder', path: '/dashboard' });
      setPath(tempPath);
    };

    fetchBreadcrumbPath();
  }, [currentMapId, currentFolderId, supabase]);

  return (
    <nav className="text-sm font-medium text-slate-500 mb-4">
      <ol className="list-none p-0 inline-flex">
        {path.map((item, index) => (
          <li key={item.id} className="flex items-center">
            <Link href={item.path} className="text-slate-600 hover:text-slate-800">
              {item.name}
            </Link>
            {index < path.length - 1 && (
              <span className="mx-2 text-slate-400">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
