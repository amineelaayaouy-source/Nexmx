'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const MENU_ITEMS = [
  { name: 'Accueil', path: '/', icon: '🏠' },
  { name: 'Store Products', path: '/store-products', icon: '🛍️' },
  { name: 'Test', path: '/test', icon: '🧪' },
  { name: 'Marketing Studio', path: '/marketing-studio', icon: '🎥' },
  { name: 'Mes Projets', path: '/', icon: '📁' }, // Currently active
  { name: 'Audit Stripe', path: '/audit-stripe', icon: '💳' },
  { name: 'Analyse', path: '/analyse', icon: '🎧' },
  { name: 'Marketing', path: '/marketing', icon: '📣' },
  { name: 'Facebook Ads', path: '/facebook-ads', icon: '⚡' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = MENU_ITEMS.findIndex((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center space-x-2">
          <span className="bg-indigo-600 text-white rounded-md p-1 px-2 text-sm">N</span>
          <span className="text-gray-900 dark:text-white">Nexmx</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">The AI engine for e-commerce</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {MENU_ITEMS.map((item, index) => {
          // Highlight the entry matching the current route. findIndex returns the
          // first match, so of the two entries pointing at "/" only Accueil lights
          // up. Previously this was hardcoded to "Mes Projets", which stayed
          // highlighted on every page.
          const isActive = index === activeIndex;

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full">
          <span className="text-lg">⚙️</span>
          <span>Paramètres</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
        >
          <span className="text-lg">🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
