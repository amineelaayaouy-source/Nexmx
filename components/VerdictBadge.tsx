import React from 'react';
import type { Verdict } from '../lib/ai/analysis';

/**
 * Verdict pill, shared by the product grid and the saved-analyses list so a
 * WIN looks the same everywhere it appears.
 */

const STYLES: Record<Verdict, string> = {
  WIN: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  TEST: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700',
  AVOID:
    'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
};

export function scoreTextColor(score: number): string {
  if (score >= 8) return 'text-green-600 dark:text-green-400';
  if (score >= 5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export default function VerdictBadge({
  verdict,
  score,
  size = 'sm',
}: {
  verdict: Verdict;
  score?: number;
  size?: 'sm' | 'md';
}) {
  const padding = size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${padding} ${STYLES[verdict]}`}
    >
      {verdict}
      {score !== undefined && <span className="tabular-nums opacity-80">{score}/10</span>}
    </span>
  );
}

/** Short, locale-aware date for list views. */
export function formatAnalysisDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
