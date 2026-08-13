'use client';

import React from 'react';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  icon: string;
  description: string;
}

/**
 * Placeholder for sidebar destinations that are not built yet. Keeps the nav
 * honest - the route resolves and says what it will do, instead of 404-ing.
 */
export default function ComingSoon({ title, icon, description }: ComingSoonProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">{icon}</div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>

          <span className="inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
            Bientôt disponible
          </span>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">{description}</p>

          <div className="mt-8 flex items-center justify-center space-x-3">
            <Link
              href="/"
              className="text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/store-products"
              className="text-sm font-medium px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Voir les produits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
