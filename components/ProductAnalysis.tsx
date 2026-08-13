'use client';

import React from 'react';
import type { AnalysisResult, Verdict } from '../lib/ai/analysis';

/**
 * Renders a product analysis result. Presentation only - it receives a parsed,
 * already-validated result and never talks to the API itself.
 */

const VERDICT_STYLES: Record<Verdict, { badge: string; label: string }> = {
  TEST: {
    badge:
      'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    label: 'TEST',
  },
  'TEST WITH CAUTION': {
    badge:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
    label: 'TEST AVEC PRUDENCE',
  },
  SKIP: {
    badge:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    label: 'SKIP',
  },
};

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 45) return 'bg-amber-500';
  return 'bg-red-500';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
          {score}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(score)}`}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

interface Props {
  result: AnalysisResult;
  model?: string;
}

export default function ProductAnalysis({ result, model }: Props) {
  const verdict = VERDICT_STYLES[result.verdict];
  const overall = result.scores.overall_score;

  return (
    <div className="space-y-6">
      {/* Verdict + overall score */}
      <div className="flex items-center gap-5 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="text-center shrink-0">
          <div
            className={`text-3xl font-bold tabular-nums ${
              overall >= 70
                ? 'text-green-600 dark:text-green-400'
                : overall >= 45
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            }`}
          >
            {overall}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">
            Score global
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${verdict.badge}`}
          >
            {verdict.label}
          </span>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            {result.verdict_reasoning}
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Détail des scores
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <ScoreBar label="Faisabilité COD" score={result.scores.cod_feasibility_score} />
          <ScoreBar label="Facteur d'impulsion" score={result.scores.impulse_factor_score} />
          <ScoreBar
            label="Potentiel créatif"
            score={result.scores.creative_potential_score}
          />
          <ScoreBar label="Faible risque" score={result.scores.low_risk_score} />
        </div>
      </section>

      {/* Summary */}
      {(result.product_summary.problem_solved ||
        result.product_summary.target_audience) && (
        <section className="grid sm:grid-cols-2 gap-4">
          {result.product_summary.problem_solved && (
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Problème résolu
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {result.product_summary.problem_solved}
              </p>
            </div>
          )}
          {result.product_summary.target_audience && (
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Audience cible
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {result.product_summary.target_audience}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Pricing */}
      {(result.recommended_pricing_mxn.suggested_price ||
        result.recommended_pricing_mxn.perceived_value_anchor) && (
        <section className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
            Prix recommandé (MXN)
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                Prix de vente suggéré
              </p>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mt-0.5">
                {result.recommended_pricing_mxn.suggested_price || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                Ancre de valeur perçue
              </p>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mt-0.5">
                {result.recommended_pricing_mxn.perceived_value_anchor || '—'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Marketing angles */}
      {result.top_3_marketing_angles.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Angles marketing
          </h4>
          <div className="space-y-3">
            {result.top_3_marketing_angles.map((angle, i) => (
              <div
                key={`${angle.angle_name}-${i}`}
                className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-400 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {angle.angle_name}
                  </h5>
                </div>

                {angle.hook_spanish_mx && (
                  <blockquote className="border-l-2 border-indigo-400 pl-3 my-2">
                    <p className="text-sm italic text-gray-800 dark:text-gray-200">
                      “{angle.hook_spanish_mx}”
                    </p>
                  </blockquote>
                )}

                {angle.core_message && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {angle.core_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Objections */}
      {result.major_objections.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Objections principales
          </h4>
          <ul className="space-y-2">
            {result.major_objections.map((objection, i) => (
              <li
                key={i}
                className="flex gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <span className="text-amber-500 shrink-0">⚠</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{objection}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {model && (
        <p className="text-xs text-gray-400 text-center pt-2">
          Analyse générée par {model}
        </p>
      )}
    </div>
  );
}
