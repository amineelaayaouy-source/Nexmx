'use client';

import React, { useState } from 'react';
import {
  DEFAULT_ANALYSIS_MODEL,
  DEFAULT_ANALYSIS_PROMPT,
  MODEL_OPTIONS,
  PROMPT_PLACEHOLDERS,
} from '../lib/ai/defaults';

/**
 * "AI Analysis Configuration" section of the settings page.
 *
 * Owns the model choice and the analysis prompt. The OpenRouter key field is
 * write-only: the server never returns the stored value, so an empty field
 * means "keep the existing key".
 */

interface Props {
  model: string;
  prompt: string;
  /** Whether a key is already stored server-side. */
  hasKey: boolean;
  /** Whether the key comes from OPENROUTER_API_KEY rather than the database. */
  keyFromEnv: boolean;
  onChange: (next: { model?: string; prompt?: string; apiKey?: string }) => void;
  onSave: () => void;
  isSaving: boolean;
  apiKeyDraft: string;
}

export default function AnalysisSettings({
  model,
  prompt,
  hasKey,
  keyFromEnv,
  onChange,
  onSave,
  isSaving,
  apiKeyDraft,
}: Props) {
  const knownModel = MODEL_OPTIONS.some((m) => m.id === model);
  const [useCustomModel, setUseCustomModel] = useState(!knownModel && model !== '');

  return (
    <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
        Configuration de l&apos;analyse IA
      </h2>

      <div className="space-y-5">
        {/* API key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Clé API OpenRouter
          </label>

          {keyFromEnv ? (
            <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
              Fournie par la variable d&apos;environnement du serveur
              <code className="font-mono text-xs mx-1">OPENROUTER_API_KEY</code>
              (prioritaire sur toute valeur enregistrée ici).
            </p>
          ) : (
            <>
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => onChange({ apiKey: e.target.value })}
                autoComplete="off"
                placeholder={
                  hasKey ? '•••••••••••••• (enregistrée)' : 'sk-or-v1-...'
                }
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                {hasKey
                  ? 'Une clé est déjà enregistrée. Laissez le champ vide pour la conserver.'
                  : 'Une seule clé donne accès à Claude, GPT et Gemini.'}{' '}
                La clé reste côté serveur et n&apos;est jamais renvoyée au navigateur.
              </p>
            </>
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Modèle d&apos;analyse
          </label>

          {useCustomModel ? (
            <input
              type="text"
              value={model}
              onChange={(e) => onChange({ model: e.target.value })}
              placeholder="fournisseur/nom-du-modele"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            />
          ) : (
            <select
              value={model}
              onChange={(e) => onChange({ model: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              const next = !useCustomModel;
              setUseCustomModel(next);
              if (!next && !MODEL_OPTIONS.some((m) => m.id === model)) {
                onChange({ model: DEFAULT_ANALYSIS_MODEL });
              }
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
          >
            {useCustomModel
              ? 'Choisir dans la liste'
              : 'Saisir un ID de modèle personnalisé'}
          </button>
        </div>

        {/* Placeholders helper */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-md">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Variables disponibles dans le prompt
          </p>
          <ul className="grid sm:grid-cols-2 gap-1">
            {PROMPT_PLACEHOLDERS.map(({ tag, description }) => (
              <li key={tag} className="text-xs text-gray-600 dark:text-gray-400">
                <code className="font-mono text-indigo-600 dark:text-indigo-400">
                  {tag}
                </code>{' '}
                — {description}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Une variable inconnue est laissée telle quelle dans le prompt, ce qui rend
            une faute de frappe visible dans le résultat.
          </p>
        </div>

        {/* Prompt editor */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prompt d&apos;analyse
            </label>
            <button
              type="button"
              onClick={() => onChange({ prompt: DEFAULT_ANALYSIS_PROMPT })}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Réinitialiser au prompt par défaut
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            rows={16}
            spellCheck={false}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs leading-relaxed resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            Le prompt doit demander explicitement une réponse JSON stricte, sinon
            l&apos;analyse échouera au parsing.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}
          </button>
        </div>
      </div>
    </section>
  );
}
