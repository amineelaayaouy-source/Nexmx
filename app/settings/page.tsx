'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    shopify_url: '',
    shopify_token: '',
    openrouter_key: '',
    higgsfield_key: '',
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Saved successfully!');
      } else {
        setStatus('Error saving settings.');
      }
    } catch (err) {
      setStatus('Error saving settings.');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <>
      <TopBar storeName={settings.shopify_url || 'Boutique Shopify'} storeUrl={settings.shopify_url || 'Non connecté'} />
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Paramètres & Intégrations</h1>
        
        <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2">Shopify</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de la boutique (ex: store.myshopify.com)</label>
              <input
                type="text"
                name="shopify_url"
                value={settings.shopify_url}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="nom-boutique.myshopify.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token (Admin API)</label>
              <input
                type="password"
                name="shopify_token"
                value={settings.shopify_token}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="shpat_..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2">API d'Intelligence Artificielle</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OpenRouter API Key (Texte & Analyse)</label>
              <input
                type="password"
                name="openrouter_key"
                value={settings.openrouter_key}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="sk-or-v1-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Higgsfield API Key (Génération d'images/vidéos)</label>
              <input
                type="password"
                name="higgsfield_key"
                value={settings.higgsfield_key}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="hgf_..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm font-medium text-green-600">{status}</span>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Enregistrer les paramètres
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
