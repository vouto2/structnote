import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Folder, FileText, FilePlus } from 'lucide-react';
import Link from 'next/link';
import CreateNewMapButton from '@/components/CreateNewMapButton';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { folderId: string };
};

// TODO: Define these types globally
type FolderType = {
  id: string;
  name: string;
};

type MapType = {
  id: string;
  title: string;
  updated_at: string;
};

async function getFolderData(supabase: any, folderId: string) {
  const { data, error } = await supabase
    .from('folders')
    .select('id, name')
    .eq('id', folderId)
    .single();
  if (error) console.error('Error fetching folder details:', error);
  return data;
}

async function getChildFolders(supabase: any, folderId: string) {
  const { data, error } = await supabase
    .from('folders')
    .select('id, name')
    .eq('parent_folder_id', folderId)
    .order('name');
  if (error) {
    console.error('Error fetching child folders:', error);
    return []; // Ensure an empty array is returned on error
  }
  console.log('Fetched child folders for folderId:', folderId, data); // Add this log
  return data || [];
}

async function getMapsInFolder(supabase: any, folderId: string) {
  const { data, error } = await supabase
    .from('maps')
    .select('id, title, updated_at')
    .eq('folder_id', folderId)
    .order('title');
  if (error) console.error('Error fetching maps:', error);
  return data || [];
}

export default async function FolderPage({ params }: PageProps) {
  const supabase = await createClient();
  const { folderId } = await params;

  const [currentFolder, childFolders, maps] = await Promise.all([
    getFolderData(supabase, folderId),
    getChildFolders(supabase, folderId),
    getMapsInFolder(supabase, folderId),
  ]);

  if (!currentFolder) {
    return <div className="text-center">フォルダが見つかりません。</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{currentFolder.name}</h2>
        <div className="flex space-x-2">
          <Link href="/dashboard/templates" className="px-4 py-2 bg-slate-800 text-white rounded-md font-semibold text-sm hover:bg-slate-700 flex items-center space-x-2">
            <FilePlus className="w-4 h-4" />
            <span>テンプレートから作成</span>
          </Link>
          <CreateNewMapButton folderId={folderId} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {childFolders.map((folder: FolderType) => (
          <Link key={folder.id} href={`/dashboard/folder/${folder.id}`}>
            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center space-x-4 hover:shadow-md hover:border-slate-300 transition cursor-pointer">
              <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-sky-100 flex items-center justify-center">
                <Folder className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 truncate">{folder.name}</h3>
              </div>
            </div>
          </Link>
        ))}

        {maps.map((map: MapType) => (
          <Link key={map.id} href={`/dashboard/map/${map.id}`}>
            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center space-x-4 hover:shadow-md hover:border-slate-300 transition cursor-pointer">
              <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 truncate">{map.title}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(map.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {childFolders.length === 0 && maps.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">このフォルダにはアイテムがありません。</p>
        </div>
      )}
    </div>
  );
}
