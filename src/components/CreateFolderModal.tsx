'use client';

import { useState, useEffect } from 'react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folderName: string) => void;
}

export default function CreateFolderModal({ isOpen, onClose, onCreateFolder }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFolderName(''); // Clear input when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      onClose(); // Close modal after creation
    } else {
      alert('フォルダ名を入力してください。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="relative bg-white rounded-xl shadow-2xl w-11/12 max-w-md m-4 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">新しいフォルダを作成</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="folder-name" className="block text-sm font-medium text-slate-600 mb-1">フォルダ名</label>
              <input
                type="text"
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition"
                placeholder="フォルダ名を入力..."
              />
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-5 py-2 bg-white text-slate-700 border border-slate-300 rounded-md font-semibold text-sm hover:bg-slate-100">
            キャンセル
          </button>
          <button onClick={handleCreate} className="px-5 py-2 bg-slate-800 text-white rounded-md font-semibold text-sm hover:bg-slate-700">
            作成
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.3s forwards; }
      `}</style>
    </div>
  );
}
