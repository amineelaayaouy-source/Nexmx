'use client';

import React, { useState, useEffect } from 'react';
import ProductInput from '../components/ProductInput';
import PipelineDashboard from '../components/PipelineDashboard';
import TopBar from '../components/TopBar';

export default function Home() {
  const [settings, setSettings] = useState({ shopify_url: '', shopify_token: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        
        <div className="mb-2">
          <button className="text-gray-400 hover:text-gray-600 text-sm flex items-center space-x-1">
            <span>←</span>
            <span>Mes projets</span>
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          runing
        </h1>

        <div className="mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
             <div className="flex items-center space-x-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                  <span className="text-xl">🛍️</span>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Boutique Shopify</h2>
                  <p className="text-xs text-gray-500">{settings.shopify_url || 'Non configuré'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {settings.shopify_url ? (
                  <div className="flex items-center space-x-2 text-xs font-medium text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span>Connectée</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs font-medium text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>Déconnecté</span>
                  </div>
                )}
                
                <button 
                  onClick={() => window.location.href='/settings'}
                  className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors border border-gray-200"
                >
                  Changer
                </button>
              </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-8">
          <PipelineDashboard />
        </div>
        
        <div className="flex justify-center">
          <div className="w-full">
            <ProductInput />
          </div>
        </div>
        
      </div>
    </div>
  );
}
