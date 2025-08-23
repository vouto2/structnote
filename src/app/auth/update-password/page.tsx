'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります。');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError('パスワードの更新中にエラーが発生しました。もう一度お試しください。');
      console.error('Password update error:', error.message);
    } else {
      setMessage('パスワードが正常に更新されました。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">新しいパスワードを設定</h1>
        {message && (
          <div className="text-center bg-green-100 text-green-800 p-3 rounded-md mb-4">
            <p>{message}</p>
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              ログインページに進む
            </Link>
          </div>
        )}
        {error && (
          <div className="text-center bg-red-100 text-red-800 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {!message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                新しいパスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                新しいパスワード（確認）
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              パスワードを更新
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
