/**
 * Types and parsing for the product analysis result.
 *
 * Models frequently wrap JSON in markdown fences or add a sentence before it,
 * even when told not to. Parsing is therefore tolerant about the envelope and
 * strict about the contents: anything that does not match the schema is
 * rejected rather than rendered as a half-empty report.
 */

export const VERDICTS = ['TEST', 'TEST WITH CAUTION', 'SKIP'] as const;
export type Verdict = (typeof VERDICTS)[number];

export interface MarketingAngle {
  angle_name: string;
  hook_spanish_mx: string;
  core_message: string;
}

export interface AnalysisResult {
  product_summary: {
    problem_solved: string;
    target_audience: string;
  };
  scores: {
    cod_feasibility_score: number;
    impulse_factor_score: number;
    creative_potential_score: number;
    low_risk_score: number;
    overall_score: number;
  };
  verdict: Verdict;
  verdict_reasoning: string;
  recommended_pricing_mxn: {
    suggested_price: string;
    perceived_value_anchor: string;
  };
  top_3_marketing_angles: MarketingAngle[];
  major_objections: string[];
}

export class AnalysisParseError extends Error {
  /** Raw model output, kept for the server log only - never sent to the client. */
  readonly raw: string;

  constructor(message: string, raw: string) {
    super(message);
    this.name = 'AnalysisParseError';
    this.raw = raw;
  }
}

/**
 * Pull a JSON object out of a model response that may be fenced or prefixed.
 */
function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();

  // ```json ... ``` or ``` ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  // Otherwise take the outermost {...} span.
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

/** Coerce to an integer score inside 0-100; NaN and out-of-range are clamped. */
function asScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asVerdict(value: unknown): Verdict | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return (VERDICTS as readonly string[]).includes(normalized)
    ? (normalized as Verdict)
    : null;
}

export function parseAnalysisResult(raw: string): AnalysisResult {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) {
    throw new AnalysisParseError(
      "Le modèle n'a pas renvoyé de JSON exploitable.",
      raw
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new AnalysisParseError('Le JSON renvoyé par le modèle est invalide.', raw);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new AnalysisParseError('Le modèle a renvoyé une valeur non-objet.', raw);
  }

  const verdict = asVerdict(parsed.verdict);
  if (!verdict) {
    throw new AnalysisParseError(
      `Verdict manquant ou invalide (attendu: ${VERDICTS.join(', ')}).`,
      raw
    );
  }

  const bag = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  const scores = bag(parsed.scores);
  const summary = bag(parsed.product_summary);
  const pricing = bag(parsed.recommended_pricing_mxn);

  const angles: MarketingAngle[] = Array.isArray(parsed.top_3_marketing_angles)
    ? (parsed.top_3_marketing_angles as unknown[])
        .filter((a) => a && typeof a === 'object')
        .slice(0, 3)
        .map((entry) => {
          const a = entry as Record<string, unknown>;
          return {
            angle_name: asString(a.angle_name, 'Angle'),
            hook_spanish_mx: asString(a.hook_spanish_mx),
            core_message: asString(a.core_message),
          };
        })
        .filter((a) => a.hook_spanish_mx || a.core_message)
    : [];

  const objections: string[] = Array.isArray(parsed.major_objections)
    ? parsed.major_objections
        .map((o: unknown) => asString(o))
        .filter((o: string) => o.length > 0)
    : [];

  const reasoning = asString(parsed.verdict_reasoning);
  if (!reasoning) {
    throw new AnalysisParseError('verdict_reasoning manquant.', raw);
  }

  return {
    product_summary: {
      problem_solved: asString(summary.problem_solved),
      target_audience: asString(summary.target_audience),
    },
    scores: {
      cod_feasibility_score: asScore(scores.cod_feasibility_score),
      impulse_factor_score: asScore(scores.impulse_factor_score),
      creative_potential_score: asScore(scores.creative_potential_score),
      low_risk_score: asScore(scores.low_risk_score),
      overall_score: asScore(scores.overall_score),
    },
    verdict,
    verdict_reasoning: reasoning,
    recommended_pricing_mxn: {
      suggested_price: asString(pricing.suggested_price),
      perceived_value_anchor: asString(pricing.perceived_value_anchor),
    },
    top_3_marketing_angles: angles,
    major_objections: objections,
  };
}

/**
 * Replace {placeholder} tags with real values.
 *
 * Values are injected verbatim. Unknown tags are left untouched so a typo in a
 * custom prompt is visible in the output rather than silently blanked.
 */
export function interpolatePrompt(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
  );
}
