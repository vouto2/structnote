'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext'; // Import useUser
import { Mail } from 'lucide-react';

export default function ProfilePage() {
  const supabase = createClient();
  const { displayName: contextDisplayName, updateDisplayName, isLoading } = useUser();

  // Local state for form inputs
  const [displayName, setDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State for messages and errors
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize form with data from context
    if (contextDisplayName) {
      setDisplayName(contextDisplayName);
    }

    // Fetch non-contextual user data like email
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
  }, [contextDisplayName, supabase]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('ユーザーが認証されていません。');
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      setError(`プロフィールの更新に失敗しました: ${updateError.message}`);
    } else {
      setMessage('プロフィールを更新しました。');
      // Update the shared context, which will update the header
      updateDisplayName(displayName);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません。');
      return;
    }
    if (newPassword.length < 6) {
      setError('パスワードは6文字以上である必要があります。');
      return;
    }

    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });

    if (passwordError) {
      setError(`パスワードの変更に失敗しました: ${passwordError.message}`);
    } else {
      setMessage('パスワードを変更しました。');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">マイプロフィール</h1>

      {message && (
        <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4 text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 text-center">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">プロフィール情報</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <div className="mt-1 flex items-center space-x-2">
              <Mail className="w-5 h-5 text-gray-500" />
              <p className="text-gray-900">{userEmail || ''}</p>
            </div>
          </div>
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">表示名</label>
            <input
              type="text"
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              プロフィールを更新
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">パスワード変更</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">新しいパスワード</label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">新しいパスワード（確認）</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              パスワードを変更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
