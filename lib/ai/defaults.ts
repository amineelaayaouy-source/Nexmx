/**
 * Defaults and constants for the AI product analysis engine.
 *
 * Shared by the server (settings resolver, analyze route) and the client
 * (settings UI). Contains no credentials.
 */

/** Settings table keys used by this feature. */
export const ANALYSIS_MODEL_KEY = 'analysis_model';
export const ANALYSIS_PROMPT_KEY = 'analysis_prompt';

/**
 * Model IDs are OpenRouter slugs, verified against the live catalogue.
 * A custom ID can be entered in the settings UI, so a catalogue change never
 * hard-blocks the feature.
 */
export const MODEL_OPTIONS = [
  { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5 (équilibré, recommandé)' },
  { id: 'anthropic/claude-opus-5', label: 'Claude Opus 5 (le plus capable)' },
  { id: 'anthropic/claude-opus-5-fast', label: 'Claude Opus 5 Fast' },
  { id: 'openai/gpt-5.6-terra', label: 'GPT-5.6 Terra' },
  { id: 'openai/gpt-5.6-terra-pro', label: 'GPT-5.6 Terra Pro' },
  { id: 'google/gemini-3.6-flash', label: 'Gemini 3.6 Flash (rapide, économique)' },
] as const;

export const DEFAULT_ANALYSIS_MODEL = 'anthropic/claude-sonnet-5';

/**
 * Template tags replaced with real product data before the prompt is sent.
 * Displayed in the settings UI helper box.
 */
export const PROMPT_PLACEHOLDERS = [
  { tag: '{product_title}', description: 'Titre du produit' },
  { tag: '{product_description}', description: 'Description / specs du produit' },
  { tag: '{supplier_cost}', description: 'Coût fournisseur (ou "Unknown")' },
  { tag: '{selling_price}', description: 'Prix de vente cible en MXN' },
  { tag: '{target_market}', description: 'Marché cible (par défaut : Mexico)' },
] as const;

export const DEFAULT_ANALYSIS_PROMPT = `You are an expert e-commerce product analyst and direct-response marketer specializing in Cash on Delivery (COD) for the {target_market} market.

Conduct a rigorous "Product Viability & Testing Analysis" for the following product.

PRODUCT INPUT DATA:
- Product Title: {product_title}
- Source Description / Specs: {product_description}
- Supplier Cost: {supplier_cost}
- Selling Price Target (MXN): {selling_price}

ANALYSIS REQUIREMENTS:
Analyze the product through the lens of a high-speed COD testing model in {target_market}, across these 4 dimensions:

1. COD & FINANCIAL FEASIBILITY
- Margins: is the potential price 3x-4x the sourcing cost?
- Shipping risk: heavy, bulky or fragile (high return/refusal risk)?
- Local market fit: culturally relevant and needed right now?

2. IMPULSE BUY & PROBLEM INTENSITY
- Does it solve a sharp, clear pain point?
- Wow / demonstration factor: can it stop the scroll in the first 3 seconds of a video?
- Saturation: is it easily available at physical retail (Walmart, OXXO, farmacias, local markets)? If yes, that is high risk.

3. CREATIVE & MARKETING ANGLES POTENTIAL
- UGC viability: is it easy to record or simulate authentic local UGC ads?
- Target audience clarity: who is the exact buyer?
- Key objections: the top 2-3 hesitations and how to counter them.

4. OPERATIONAL & POLICY RISKS
- Meta ad policy risk: risk of rejection or ban (health claims, before/after imagery, personal attributes).
- Quality & refusal risk: is quality likely to cause refusal on delivery?

RULES:
- Be decisive and commercially honest. If the product is weak, say SKIP.
- Hooks must be in authentic Mexican Spanish, natural and spoken, not translated.
- Never invent supplier costs or competitor prices. If cost is "Unknown", reason about it explicitly.
- Do not produce marketing claims that would violate advertising policy or make unsupported health claims.
- Scores are 0-100. overall_score must reflect the other four, not be an arbitrary number.

OUTPUT FORMAT:
Return ONLY a valid JSON object, no markdown fences and no commentary, matching exactly:
{
  "product_summary": { "problem_solved": "", "target_audience": "" },
  "scores": {
    "cod_feasibility_score": 0,
    "impulse_factor_score": 0,
    "creative_potential_score": 0,
    "low_risk_score": 0,
    "overall_score": 0
  },
  "verdict": "TEST" | "TEST WITH CAUTION" | "SKIP",
  "verdict_reasoning": "",
  "recommended_pricing_mxn": { "suggested_price": "", "perceived_value_anchor": "" },
  "top_3_marketing_angles": [
    { "angle_name": "", "hook_spanish_mx": "", "core_message": "" }
  ],
  "major_objections": []
}`;
