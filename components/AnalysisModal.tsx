'use client';

import React, { useEffect } from 'react';

/**
 * Scrolling dialog used to show a product analysis, from the product grid and
 * from Mes Projets alike.
 *
 * Closing it is always non-destructive: the analysis it shows is already stored,
 * so the dialog is a view onto saved data, never the only copy of it.
 */

interface Props {
  eyebrow?: string;
  title: string;
  onClose: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

export default function AnalysisModal({
  eyebrow,
  title,
  onClose,
  headerExtra,
  children,
}: Props) {
  // Escape closes the dialog, matching what the backdrop click already does.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-gray-950 rounded-xl shadow-xl w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-gray-50 dark:bg-gray-950 rounded-t-xl z-10">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs uppercase tracking-wide text-gray-500">{eyebrow}</p>
            )}
            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerExtra}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none px-2"
            >
              ×
            </button>
          </div>
        </header>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
