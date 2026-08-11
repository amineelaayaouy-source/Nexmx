'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  { name: 'Accueil', path: '/', icon: '🏠' },
  { name: 'Tendances', path: '/tendances', icon: '📈' },
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
        {MENU_ITEMS.map((item) => {
          // Since all placeholder routes aren't built, we treat '/' as 'Mes Projets' for now
          // to match the screenshot state.
          const isActive = item.name === 'Mes Projets';
          
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

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
          <span className="text-lg">⚙️</span>
          <Link href="/settings">Paramètres</Link>
        </div>
      </div>
    </aside>
  );
}
