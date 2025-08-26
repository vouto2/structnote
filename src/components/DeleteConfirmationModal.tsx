
'use client';

import { useState, useEffect } from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: 'フォルダ' | 'マップ';
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName, itemType = 'アイテム' }: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="relative bg-white rounded-xl shadow-2xl w-11/12 max-w-md m-4 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in-scale">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-2 text-center">{itemType}を削除しますか？</h2>
          <p className="text-center text-slate-600 mb-6">
            {itemType}「<span className="font-bold">{itemName}</span>」を完全に削除します。<br />この操作は元に戻すことができません。
          </p>
        </div>
        <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-5 py-2 bg-white text-slate-700 border border-slate-300 rounded-md font-semibold text-sm hover:bg-slate-100">
            キャンセル
          </button>
          <button onClick={onConfirm} className="px-5 py-2 bg-red-600 text-white rounded-md font-semibold text-sm hover:bg-red-700">
            削除する
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
