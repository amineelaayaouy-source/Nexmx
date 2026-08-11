'use client';

import React from 'react';
import Link from 'next/link';

interface TopBarProps {
  storeName?: string;
  storeUrl?: string;
}

export default function TopBar({ storeName = 'Boutique Shopify', storeUrl = 'Non connecté' }: TopBarProps) {
  const isConnected = storeUrl !== 'Non connecté';

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <span className="text-xl">🛍️</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{storeName}</h2>
          <p className="text-xs text-gray-500">{storeUrl}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isConnected ? (
          <div className="flex items-center space-x-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Connectée</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Déconnecté</span>
          </div>
        )}
        
        <Link 
          href="/settings"
          className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors border border-gray-200"
        >
          {isConnected ? 'Changer' : 'Connecter'}
        </Link>
      </div>
    </header>
  );
}
