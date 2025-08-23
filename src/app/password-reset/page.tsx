'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'; // Updated import

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient(); // Initialize Supabase client

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/update-password`,
    });

    if (error) {
      setError('エラーが発生しました。もう一度お試しください。');
    } else {
      setMessage('パスワード再設定用のメールを送信しました。受信トレイをご確認ください。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">パスワードをリセット</h1>
        {message && (
          <div className="text-center bg-green-100 text-green-800 p-3 rounded-md mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="text-center bg-red-100 text-red-800 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {!message && (
            <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600">
              ご登録のメールアドレスを入力してください。パスワード再設定用のリンクを送信します。
            </p>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              再設定リンクを送信
            </button>
          </form>
        )}
         <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            ログインページに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}