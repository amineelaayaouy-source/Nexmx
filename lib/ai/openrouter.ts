import { getOpenRouterApiKey } from './settings';

/**
 * Minimal OpenRouter chat-completions client.
 *
 * One key reaches Claude, GPT and Gemini, so the model dropdown only changes the
 * routed model ID. The key is read server-side and never leaves this module.
 */

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "Clé OpenRouter absente. Définissez OPENROUTER_API_KEY côté serveur, ou renseignez-la dans Paramètres."
    );
    this.name = 'MissingApiKeyError';
  }
}

export interface CompletionRequest {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  /** Ask the provider for a JSON-only response where supported. */
  jsonMode?: boolean;
}

export async function createChatCompletion({
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.4,
  jsonMode = false,
}: CompletionRequest): Promise<string> {
  const apiKey = await getOpenRouterApiKey();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const body: Record<string, unknown> = {
    model,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  // Analysis calls are slow; abort rather than hang the serverless function.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        // Optional OpenRouter attribution headers.
        'X-Title': 'Nexmx',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("L'analyse a dépassé le délai de 90 secondes. Réessayez ou choisissez un modèle plus rapide.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    // Truncated, and the key is never part of the response body.
    throw new Error(
      `OpenRouter a répondu ${response.status}: ${detail.slice(0, 300)}`
    );
  }

  const data = await response.json();

  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Réponse vide du modèle. Vérifiez que l'ID du modèle est valide.");
  }

  return content;
}
