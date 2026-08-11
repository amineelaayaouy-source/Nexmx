'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '../../components/TopBar';

function SettingsContent() {
  const [settings, setSettings] = useState({
    shopify_url: '',
    openrouter_key: '',
    higgsfield_key: '',
  });
  const [shopDomainInput, setShopDomainInput] = useState('');
  const [status, setStatus] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('shopify') === 'connected') {
      setStatus('Shopify connecté avec succès !');
      setTimeout(() => setStatus(''), 5000);
      router.replace('/settings');
    }

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      });
  }, [searchParams, router]);

  const handleAiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sauvegarde en cours...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouter_key: settings.openrouter_key,
          higgsfield_key: settings.higgsfield_key,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Paramètres IA enregistrés !');
      } else {
        setStatus('Erreur lors de la sauvegarde.');
      }
    } catch (err) {
      setStatus('Erreur lors de la sauvegarde.');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleConnectShopify = () => {
    if (!shopDomainInput) {
      alert('Veuillez entrer une URL de boutique valide.');
      return;
    }
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(shopDomainInput)}`;
  };

  const handleDisconnectShopify = async () => {
    if (!confirm('Voulez-vous vraiment déconnecter cette boutique ?')) return;
    
    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/shopify/disconnect', { method: 'POST' });
      if (res.ok) {
        setSettings({ ...settings, shopify_url: '' });
        setStatus('Boutique déconnectée.');
      } else {
        setStatus('Erreur de déconnexion.');
      }
    } catch (e) {
      setStatus('Erreur de déconnexion.');
    }
    setIsDisconnecting(false);
    setTimeout(() => setStatus(''), 3000);
  };

  const isShopifyConnected = !!settings.shopify_url;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      <TopBar storeName={settings.shopify_url || 'Boutique Shopify'} storeUrl={settings.shopify_url || 'Non connecté'} />
      <div className="p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Paramètres & Intégrations</h1>
        
        {status && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm font-medium border border-green-200 dark:border-green-800">
            {status}
          </div>
        )}

        <div className="space-y-8">
          <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">Intégration Shopify</h2>
            
            {isShopifyConnected ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-800">
                  <span className="text-green-500 text-xl">🟢</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Shopify Connecté</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{settings.shopify_url}</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectShopify}
                  disabled={isDisconnecting}
                  className="self-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-md transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? 'Déconnexion...' : 'Déconnecter la boutique'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de la boutique (ex: store.myshopify.com)</label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={shopDomainInput}
                      onChange={(e) => setShopDomainInput(e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="nom-boutique.myshopify.com"
                    />
                    <button
                      onClick={handleConnectShopify}
                      className="bg-[#95bf47] hover:bg-[#86ac3f] text-white font-medium py-2 px-6 rounded-md transition-colors"
                    >
                      Connecter Shopify
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Vous serez redirigé vers Shopify pour autoriser l'accès.</p>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">API d'Intelligence Artificielle</h2>
            <form onSubmit={handleSaveAiSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OpenRouter API Key (Texte & Analyse)</label>
                <input
                  type="password"
                  name="openrouter_key"
                  value={settings.openrouter_key}
                  onChange={handleAiChange}
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
                  onChange={handleAiChange}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="hgf_..."
                />
              </div>
              
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
                >
                  Enregistrer les clés IA
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement des paramètres...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
