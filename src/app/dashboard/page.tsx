import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers'; // Keep this import
import LogoutButton from '@/components/LogoutButton';
import { Folder, FileText, FilePlus } from 'lucide-react';
import Link from 'next/link';
import CreateNewMapButton from '@/components/CreateNewMapButton';
import CreateMapFromTemplateButton from '@/components/CreateMapFromTemplateButton';

export const dynamic = 'force-dynamic';

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

export default async function DashboardPage() {
  const supabase = createServerClient( // Create client directly
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value; // Call cookies() directly here
        },
        set(name: string, value: string, options: any) {
          try {
            cookies().set({ name, value, ...options }); // Call cookies() directly here
          } catch (error) {
            // The `cookies()` helper can be called only from a Server Component, Server Action or Route Handler.
            // If you're using this Supabase client in a Client Component, it's not an issue.
          }
        },
        remove(name: string, options: any) {
          try {
            cookies().set({ name, value: '', ...options }); // Call cookies() directly here
          } catch (error) {
            // The `cookies()` helper can be called only from a Server Component, Server Action or Route Handler.
            // If you're using this Supabase client in a Client Component, it's not an issue.
          }
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  async function getRootFolders(): Promise<FolderType[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('id, name')
      .is('parent_folder_id', null)
      .order('name');
    if (error) console.error('Error fetching root folders:', error);
    return data || [];
  }

  async function getRootMaps(): Promise<MapType[]> {
    const { data, error } = await supabase
      .from('maps')
      .select('id, title, updated_at')
      .is('folder_id', null)
      .eq('is_template', false) // Exclude templates from root maps
      .order('title');
    if (error) console.error('Error fetching root maps:', error);
    return data || [];
  }

  const [rootFolders, rootMaps] = await Promise.all([
    getRootFolders(),
    getRootMaps(),
  ]);

  return (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rootFolders.map((folder: FolderType) => (
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

        {rootMaps.map((map: MapType) => (
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

      {rootFolders.length === 0 && rootMaps.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">このフォルダにはアイテムがありません。</p>
        </div>
      )}
    </div>
  );
}