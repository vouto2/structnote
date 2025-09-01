'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { FolderProvider } from '@/contexts/FolderContext';
import { UserProvider } from '@/contexts/UserContext'; // Import UserProvider

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <UserProvider> {/* Wrap with UserProvider */}
      <div className={`flex h-screen bg-slate-50 text-slate-800 ${isSidebarOpen ? 'overflow-hidden' : ''}`}>
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        <FolderProvider>
          <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
          <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64 md:ml-0' : ''}`}>
            <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </FolderProvider>
      </div>
    </UserProvider>
  );
}
