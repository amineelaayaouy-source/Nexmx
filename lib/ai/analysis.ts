/**
 * Types and parsing for the product analysis result.
 *
 * Models frequently wrap JSON in markdown fences or add a sentence before it,
 * even when told not to. Parsing is therefore tolerant about the envelope and
 * strict about the contents: anything that does not match the schema is
 * rejected rather than rendered as a half-empty report.
 */

export const VERDICTS = ['WIN', 'TEST', 'AVOID'] as const;
export type Verdict = (typeof VERDICTS)[number];

export interface ChecklistItem {
  score: number;
  reason: string;
}

export interface MarketingAngle {
  angle_name: string;
  hook_spanish_mx: string;
  core_message: string;
}

export interface AnalysisResult {
  overall_score: number;
  verdict: Verdict;
  checklist: {
    wow_effect: ChecklistItem;
    clear_problem: ChecklistItem;
    demand_potential: ChecklistItem;
    profit_margin: ChecklistItem;
    easy_to_advertise: ChecklistItem;
    cod_feasibility: ChecklistItem;
    competition: ChecklistItem;
    saturation: ChecklistItem;
    risk_level: ChecklistItem;
    scaling_potential: ChecklistItem;
  };
  strengths: string[];
  weaknesses: string[];
  marketing_angles: MarketingAngle[];
  final_recommendation: string;
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

/** Coerce to an integer score inside 0-10; NaN and out-of-range are clamped. */
function asScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function asVerdict(value: unknown): Verdict | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return (VERDICTS as readonly string[]).includes(normalized)
    ? (normalized as Verdict)
    : null;
}

function asChecklistItem(value: unknown): ChecklistItem {
  const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    score: asScore(obj.score),
    reason: asString(obj.reason),
  };
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

  const checklistObj = bag(parsed.checklist);

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.map((s: unknown) => asString(s)).filter((s) => s.length > 0)
    : [];

  const weaknesses = Array.isArray(parsed.weaknesses)
    ? parsed.weaknesses.map((s: unknown) => asString(s)).filter((s) => s.length > 0)
    : [];

  const angles: MarketingAngle[] = Array.isArray(parsed.marketing_angles)
    ? (parsed.marketing_angles as unknown[])
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

  const recommendation = asString(parsed.final_recommendation);
  if (!recommendation) {
    throw new AnalysisParseError('final_recommendation manquante.', raw);
  }

  return {
    overall_score: asScore(parsed.overall_score),
    verdict,
    checklist: {
      wow_effect: asChecklistItem(checklistObj.wow_effect),
      clear_problem: asChecklistItem(checklistObj.clear_problem),
      demand_potential: asChecklistItem(checklistObj.demand_potential),
      profit_margin: asChecklistItem(checklistObj.profit_margin),
      easy_to_advertise: asChecklistItem(checklistObj.easy_to_advertise),
      cod_feasibility: asChecklistItem(checklistObj.cod_feasibility),
      competition: asChecklistItem(checklistObj.competition),
      saturation: asChecklistItem(checklistObj.saturation),
      risk_level: asChecklistItem(checklistObj.risk_level),
      scaling_potential: asChecklistItem(checklistObj.scaling_potential),
    },
    strengths,
    weaknesses,
    marketing_angles: angles,
    final_recommendation: recommendation,
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
