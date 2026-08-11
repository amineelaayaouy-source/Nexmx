'use client';

import React, { useState } from 'react';

export default function ProductInput() {
  const [url, setUrl] = useState('');
  const [market, setMarket] = useState('France');
  const [language, setLanguage] = useState('Français');
  const [status, setStatus] = useState('');

  const markets = ['France', 'USA', 'Maroc', 'Belgique', 'Canada'];
  const languages = [
    { code: 'FR', label: 'Français' },
    { code: 'GB', label: 'English' },
    { code: 'SA', label: 'العربية' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setStatus('Analyse en cours...');
    
    try {
      const res = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, market, language })
      });
      const data = await res.json();
      if(data.success) {
        setStatus('Produit importé avec succès !');
      } else {
        setStatus('Erreur: ' + data.error);
      }
    } catch(err) {
      setStatus('Erreur lors de la communication avec le serveur.');
    }
    
    setTimeout(() => setStatus(''), 5000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-4xl">
      <h2 className="text-xl font-semibold mb-8 text-gray-900 dark:text-white">Analyser un nouveau produit</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Product URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL du produit <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemple.com/produit"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            required
          />
        </div>
        
        {/* Screenshot (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Screenshot produit <span className="text-gray-400 font-normal">(optionnel — pour AliExpress / Alibaba)</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors flex items-center justify-center space-x-2">
            <span className="text-gray-400">📷</span>
            <span className="text-sm text-gray-500">Cliquer pour uploader un screenshot JPG/PNG</span>
          </div>
        </div>
        
        {/* Target Market */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Marché cible <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {markets.map(m => (
              <button
                type="button"
                key={m}
                onClick={() => setMarket(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  market === m 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-500' 
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="Entrez votre marché..."
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Analysis Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Langue d'analyse <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {languages.map(lang => (
              <button
                type="button"
                key={lang.code}
                onClick={() => setLanguage(lang.label)}
                className={`py-3 px-4 rounded-lg text-sm font-medium border flex items-center justify-center space-x-2 transition-colors ${
                  language === lang.label 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' 
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <span className={language === lang.label ? 'opacity-80' : 'text-gray-400 font-bold'}>{lang.code}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <button 
          type="submit"
          className="w-full bg-indigo-200 hover:bg-indigo-300 text-indigo-800 font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out mt-4 shadow-sm"
        >
          Lancer l'analyse produit
        </button>
        
        {status && (
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 text-center mt-2">{status}</p>
        )}
      </form>
    </div>
  );
}
