'use client';

import React from 'react';
import type { AnalysisResult, Verdict, ChecklistItem } from '../lib/ai/analysis';

const VERDICT_STYLES: Record<Verdict, { badge: string; label: string }> = {
  WIN: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
    label: 'WIN',
  },
  TEST: {
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700',
    label: 'TEST',
  },
  AVOID: {
    badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    label: 'AVOID',
  },
};

function scoreColor(score: number): string {
  if (score >= 8) return 'bg-green-500';
  if (score >= 5) return 'bg-amber-500';
  return 'bg-red-500';
}

function CheckListRow({ label, item }: { label: string; item: ChecklistItem }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor(item.score)}`}
              style={{ width: `${(item.score / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-900 dark:text-white w-5 text-right">{item.score}/10</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{item.reason}</p>
    </div>
  );
}

interface Props {
  result: AnalysisResult;
  model?: string;
}

export default function ProductAnalysis({ result, model }: Props) {
  const verdict = VERDICT_STYLES[result.verdict];
  const overall = result.overall_score;

  return (
    <div className="space-y-6">
      {/* Verdict + overall score */}
      <div className="flex items-center gap-5 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="text-center shrink-0">
          <div
            className={`text-3xl font-bold tabular-nums ${
              overall >= 8
                ? 'text-green-600 dark:text-green-400'
                : overall >= 5
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            }`}
          >
            {overall}/10
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
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
            Recommandation: {result.final_recommendation}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Checklist d'évaluation
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <CheckListRow label="WOW Effect" item={result.checklist.wow_effect} />
          <CheckListRow label="Problème clair" item={result.checklist.clear_problem} />
          <CheckListRow label="Potentiel de la demande" item={result.checklist.demand_potential} />
          <CheckListRow label="Marge de profit" item={result.checklist.profit_margin} />
          <CheckListRow label="Facilité de publicité" item={result.checklist.easy_to_advertise} />
          <CheckListRow label="Faisabilité COD" item={result.checklist.cod_feasibility} />
          <CheckListRow label="Concurrence" item={result.checklist.competition} />
          <CheckListRow label="Saturation" item={result.checklist.saturation} />
          <CheckListRow label="Niveau de risque" item={result.checklist.risk_level} />
          <CheckListRow label="Potentiel de Scale" item={result.checklist.scaling_potential} />
        </div>
      </section>

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        {result.strengths.length > 0 && (
          <section className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg">
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
              <span>✓</span> Points forts
            </h4>
            <ul className="space-y-2">
              {result.strengths.map((str, i) => (
                <li key={i} className="text-sm text-green-700 dark:text-green-400">
                  {str}
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.weaknesses.length > 0 && (
          <section className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
              <span>⚠</span> Risques & Faiblesses
            </h4>
            <ul className="space-y-2">
              {result.weaknesses.map((weak, i) => (
                <li key={i} className="text-sm text-red-700 dark:text-red-400">
                  {weak}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Marketing angles */}
      {result.marketing_angles.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Angles marketing suggérés
          </h4>
          <div className="space-y-3">
            {result.marketing_angles.map((angle, i) => (
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

      {model && (
        <p className="text-xs text-gray-400 text-center pt-2">
          Analyse générée par {model}
        </p>
      )}
    </div>
  );
}
