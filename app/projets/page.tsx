'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TopBar from '../../components/TopBar';
import ProductAnalysis from '../../components/ProductAnalysis';
import AnalysisModal from '../../components/AnalysisModal';
import VerdictBadge, {
  formatAnalysisDate,
  scoreTextColor,
} from '../../components/VerdictBadge';
import type { AnalysisResult, Verdict } from '../../lib/ai/analysis';

/**
 * Mes Projets - every analysis that has ever been run, kept.
 *
 * The point of this page is that nothing is lost when a dialog closes: each run
 * is stored server-side and listed here until the operator deletes it.
 */

interface AnalysisSummary {
  id: string;
  productId: string | null;
  productTitle: string;
  productImage: string | null;
  productPrice: string | null;
  productCurrency: string | null;
  shop: string | null;
  model: string | null;
  overallScore: number;
  verdict: Verdict;
  createdAt: string;
}

interface OpenAnalysis extends AnalysisSummary {
  analysis: AnalysisResult;
}

const FILTERS: Array<{ key: 'ALL' | Verdict; label: string }> = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'WIN', label: 'WIN' },
  { key: 'TEST', label: 'TEST' },
  { key: 'AVOID', label: 'AVOID' },
];

function formatPrice(item: AnalysisSummary): string | null {
  if (!item.productPrice) return null;
  const amount = Number(item.productPrice);
  if (!Number.isFinite(amount)) return item.productPrice;

  if (!item.productCurrency) return String(amount);

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: item.productCurrency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${item.productCurrency}`;
  }
}

export default function ProjetsPage() {
  const [items, setItems] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | Verdict>('ALL');

  const [open, setOpen] = useState<OpenAnalysis | null>(null);
  const [isOpening, setIsOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const res = await fetch('/api/analyses');
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erreur inconnue.');
        setErrorCode(data.code ?? null);
        return;
      }

      setItems(data.analyses as AnalysisSummary[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === 'ALL' ? items : items.filter((i) => i.verdict === filter)),
    [items, filter]
  );

  const counts = useMemo(() => {
    const base: Record<string, number> = { ALL: items.length, WIN: 0, TEST: 0, AVOID: 0 };
    for (const item of items) base[item.verdict] = (base[item.verdict] ?? 0) + 1;
    return base;
  }, [items]);

  const handleOpen = async (item: AnalysisSummary) => {
    setIsOpening(item.id);
    setOpenError(null);

    try {
      const res = await fetch(`/api/analyses/${item.id}`);
      const data = await res.json();

      if (!data.success) {
        setOpenError(data.error || "Impossible d'ouvrir cette analyse.");
        return;
      }

      setOpen(data as OpenAnalysis);
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsOpening(null);
    }
  };

  const handleDelete = async (item: AnalysisSummary) => {
    setDeletingId(item.id);

    try {
      const res = await fetch(`/api/analyses/${item.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setOpen((current) => (current?.id === item.id ? null : current));
      } else {
        setOpenError(data.error || 'Suppression impossible.');
      }
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      <TopBar
        storeName={items[0]?.shop || 'Boutique Shopify'}
        storeUrl={items[0]?.shop || 'Analyses enregistrées'}
      />

      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Projets</h1>
          {!isLoading && !error && (
            <p className="text-sm text-gray-500">
              {items.length} analyse{items.length === 1 ? '' : 's'} enregistrée
              {items.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Chaque analyse produit est conservée ici. Rien n&apos;est perdu à la
          fermeture d&apos;une fenêtre.
        </p>

        {!isLoading && !error && items.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filter === key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-70 tabular-nums">{counts[key] ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Impossible de charger les analyses
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>

            {errorCode === 'DB_NOT_CONFIGURED' && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                Aucune base de données distante n&apos;est configurée. Sur Vercel le
                système de fichiers est en lecture seule&nbsp;: renseignez
                <code className="mx-1 px-1 bg-red-100 dark:bg-red-900/40 rounded">
                  TURSO_DATABASE_URL
                </code>
                et
                <code className="mx-1 px-1 bg-red-100 dark:bg-red-900/40 rounded">
                  TURSO_AUTH_TOKEN
                </code>
                puis redéployez.
              </p>
            )}

            <button
              onClick={load}
              className="mt-4 text-sm font-medium px-4 py-2 bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="p-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
            <p className="text-4xl mb-3">📁</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Aucune analyse enregistrée
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Analysez un produit et il apparaîtra ici automatiquement.
            </p>
            <Link
              href="/store-products"
              className="inline-block mt-4 text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Voir les produits
            </Link>
          </div>
        )}

        {openError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{openError}</p>
          </div>
        )}

        {!isLoading && !error && visible.length > 0 && (
          <div className="space-y-3">
            {visible.map((item) => {
              const price = formatPrice(item);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="relative w-16 h-16 shrink-0 rounded-md bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300 dark:text-gray-600">
                        🛍️
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.productTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <VerdictBadge verdict={item.verdict} />
                      <span
                        className={`text-sm font-bold tabular-nums ${scoreTextColor(item.overallScore)}`}
                      >
                        {item.overallScore}/10
                      </span>
                      {price && (
                        <span className="text-xs text-gray-500">{price}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatAnalysisDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpen(item)}
                      disabled={isOpening === item.id}
                      className="text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      {isOpening === item.id ? 'Ouverture...' : "Voir l'analyse"}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      aria-label="Supprimer cette analyse"
                      className="text-sm px-3 py-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === item.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && items.length > 0 && visible.length === 0 && (
          <div className="p-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
            <p className="text-sm text-gray-500">
              Aucune analyse avec le verdict «&nbsp;{filter}&nbsp;».
            </p>
          </div>
        )}
      </div>

      {open && (
        <AnalysisModal
          eyebrow="Analyse produit — COD Mexique"
          title={open.productTitle}
          onClose={() => setOpen(null)}
        >
          <ProductAnalysis
            result={open.analysis}
            model={open.model ?? undefined}
            savedAt={open.createdAt}
          />
        </AnalysisModal>
      )}
    </div>
  );
}
