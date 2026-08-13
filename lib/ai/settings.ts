import { getDbConnection } from '../../db';
import {
  ANALYSIS_MODEL_KEY,
  ANALYSIS_PROMPT_KEY,
  DEFAULT_ANALYSIS_MODEL,
  DEFAULT_ANALYSIS_PROMPT,
} from './defaults';

/**
 * Server-side resolution of the AI analysis configuration.
 *
 * Reads the operator's saved model and prompt from the settings table and falls
 * back to the built-in defaults, so the feature works before anything is saved.
 */

export interface AnalysisSettings {
  model: string;
  systemPrompt: string;
  /** True when the value came from the database rather than the default. */
  isCustomModel: boolean;
  isCustomPrompt: boolean;
}

export async function getAnalysisSettings(): Promise<AnalysisSettings> {
  let rows: Record<string, string> = {};

  try {
    const db = getDbConnection();
    const result = await db.execute({
      sql: 'SELECT key, value FROM settings WHERE key IN (?, ?)',
      args: [ANALYSIS_MODEL_KEY, ANALYSIS_PROMPT_KEY],
    });

    rows = (result.rows as unknown as { key: string; value: string }[]).reduce(
      (acc: Record<string, string>, row) => {
        acc[row.key] = row.value;
        return acc;
      },
      {}
    );
  } catch (error) {
    // An unreachable database must not disable analysis - fall back to defaults.
    console.error('Could not read analysis settings; using defaults', error);
  }

  const model = rows[ANALYSIS_MODEL_KEY]?.trim();
  const systemPrompt = rows[ANALYSIS_PROMPT_KEY]?.trim();

  return {
    model: model || DEFAULT_ANALYSIS_MODEL,
    systemPrompt: systemPrompt || DEFAULT_ANALYSIS_PROMPT,
    isCustomModel: Boolean(model),
    isCustomPrompt: Boolean(systemPrompt),
  };
}

/**
 * Resolve the OpenRouter API key. Environment variable wins, matching the
 * Shopify manual-credentials pattern; the settings table is the fallback so an
 * operator can configure it from the UI.
 *
 * Server-side only. Never returned from an API route.
 */
export async function getOpenRouterApiKey(): Promise<string | null> {
  const fromEnv = process.env.OPENROUTER_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  try {
    const db = getDbConnection();
    const result = await db.execute({
      sql: 'SELECT value FROM settings WHERE key = ?',
      args: ['openrouter_key'],
    });
    const value = (result.rows[0]?.value as string | undefined)?.trim();
    return value || null;
  } catch (error) {
    console.error('Could not read OpenRouter key from settings', error);
    return null;
  }
}
