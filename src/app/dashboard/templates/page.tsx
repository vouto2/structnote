'use client'; // Make it a client component

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Updated import
import { FileText } from 'lucide-react';
import TemplatePreviewModal from '@/components/TemplatePreviewModal';

type TemplateMap = {
  id: string;
  title: string;
};

export default function TemplatesPage() {
  const supabase = createClient(); // Initialize client-side Supabase client
  const [templates, setTemplates] = useState<TemplateMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMap | null>(null);

  // Fetch templates on component mount
  useState(() => { // Use useState for initial fetch to avoid useEffect re-runs on every render
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('maps')
        .select('id, title')
        .eq('is_template', true)
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching templates:', error);
        setError('テンプレートの読み込みに失敗しました。');
      } else {
        setTemplates(data);
      }
      setLoading(false);
    };
    fetchTemplates();
  }); // No dependency array, runs once on mount

  const handleTemplateClick = (template: TemplateMap) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
  };

  if (loading) {
    return <div className="p-4 md:p-8"><p>テンプレートを読み込み中...</p></div>;
  }

  if (error) {
    return <div className="p-4 md:p-8"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">テンプレートからマップを作成</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.length === 0 ? (
          <p className="text-slate-500">利用可能なテンプレートがありません。</p>
        ) : (
          templates.map(template => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center space-y-3 hover:shadow-md hover:border-slate-300 transition cursor-pointer"
            >
              <FileText className="w-12 h-12 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-center truncate w-full">{template.title}</h3>
              {/* The CreateMapFromTemplateButton will be inside the modal now */}
            </div>
          ))
        )}
      </div>

      {selectedTemplate && (
        <TemplatePreviewModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          templateId={selectedTemplate.id}
          templateTitle={selectedTemplate.title}
          folderId={null} // Pass null for folderId
        />
      )}
    </div>
  );
}
