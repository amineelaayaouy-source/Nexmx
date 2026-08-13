'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TopBar from '../../components/TopBar';

interface StoreProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  totalInventory: number | null;
  updatedAt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  variantsCount: number;
  minPrice: string | null;
  maxPrice: string | null;
  currency: string | null;
}

function formatPrice(product: StoreProduct): string {
  const { minPrice, maxPrice, currency } = product;
  if (!minPrice || !currency) return '—';

  const format = (value: string) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return value;
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  };

  if (maxPrice && maxPrice !== minPrice) {
    return `${format(minPrice)} – ${format(maxPrice)}`;
  }
  return format(minPrice);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    DRAFT:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    ARCHIVED:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  };

  const labels: Record<string, string> = {
    ACTIVE: 'Actif',
    DRAFT: 'Brouillon',
    ARCHIVED: 'Archivé',
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
        styles[status] ?? styles.DRAFT
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function ProductCard({ product }: { product: StoreProduct }) {
  const inventory = product.totalInventory;
  const outOfStock = inventory !== null && inventory <= 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt || product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-4"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300 dark:text-gray-600">
            🛍️
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2"
            title={product.title}
          >
            {product.title}
          </h3>
          <StatusBadge status={product.status} />
        </div>

        <p className="text-base font-semibold text-gray-900 dark:text-white">
          {formatPrice(product)}
        </p>

        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className={outOfStock ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {inventory === null
              ? 'Stock non suivi'
              : outOfStock
                ? 'Rupture de stock'
                : `${inventory} en stock`}
          </span>
          <span>
            {product.variantsCount} variante{product.variantsCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StoreProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [shop, setShop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // `search` is what the user is typing; `activeSearch` is the debounced value
  // actually sent to the API.
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Guards against a slow earlier request overwriting a newer one - without
  // this, typing fast can leave stale results on screen.
  const requestId = useRef(0);

  const load = useCallback(async (after: string | null, query: string) => {
    const params = new URLSearchParams({ limit: '50' });
    if (after) params.set('after', after);
    if (query) params.set('q', query);

    const res = await fetch(`/api/shopify/products?${params.toString()}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue.');
    }

    return data as {
      shop: string;
      query: string | null;
      products: StoreProduct[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }, []);

  // Debounce typing so a search fires once the user pauses, not per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Runs on mount and whenever the debounced search term changes.
  useEffect(() => {
    const id = ++requestId.current;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await load(null, activeSearch);
        if (id !== requestId.current) return; // superseded by a newer search
        setShop(data.shop);
        setProducts(data.products);
        setHasNextPage(data.pageInfo.hasNextPage);
        setCursor(data.pageInfo.endCursor);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (id === requestId.current) setIsLoading(false);
      }
    })();
  }, [load, activeSearch]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const id = requestId.current;
    try {
      const data = await load(cursor, activeSearch);
      // Drop the page if the search changed while it was in flight.
      if (id !== requestId.current) return;
      setProducts((prev) => [...prev, ...data.products]);
      setHasNextPage(data.pageInfo.hasNextPage);
      setCursor(data.pageInfo.endCursor);
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const isSearching = activeSearch.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      <TopBar
        storeName={shop || 'Boutique Shopify'}
        storeUrl={shop || 'Non connecté'}
      />

      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Produits de la boutique
          </h1>
          {!isLoading && !error && (
            <p className="text-sm text-gray-500">
              {products.length} produit{products.length === 1 ? '' : 's'}
              {isSearching ? ' trouvé' + (products.length === 1 ? '' : 's') : ''}
            </p>
          )}
        </div>

        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit (titre, référence, fournisseur...)"
            aria-label="Rechercher un produit"
            className="w-full pl-10 pr-24 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Effacer
            </button>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Impossible de charger les produits
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            <Link
              href="/settings"
              className="inline-block mt-4 text-sm font-medium text-red-700 dark:text-red-300 underline"
            >
              Vérifier la connexion Shopify
            </Link>
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div className="p-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
            <p className="text-4xl mb-3">{isSearching ? '🔍' : '🛍️'}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Aucun produit trouvé
            </p>
            {isSearching ? (
              <>
                <p className="text-sm text-gray-500 mt-1">
                  Aucun résultat pour «&nbsp;{activeSearch}&nbsp;».
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  La recherche porte sur le début des mots : «&nbsp;argi&nbsp;» trouve
                  «&nbsp;Arginina&nbsp;», mais «&nbsp;rginina&nbsp;» ne trouve rien.
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 text-sm font-medium px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
                >
                  Effacer la recherche
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Cette boutique Shopify ne contient encore aucun produit.
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-sm font-medium px-6 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? 'Chargement...' : 'Charger plus de produits'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
