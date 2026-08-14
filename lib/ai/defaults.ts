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
Analyze the product across these 10 criteria. For each, give a score (1-10) and a brief 1-sentence reason.
1. WOW Effect: visual stopping power, demonstrable.
2. Clear Problem Solved: does it relieve a sharp pain point?
3. Demand / Market Potential: breadth of audience and cultural relevance.
4. Profit Margin Potential: is the target price realistic vs cost?
5. Easy to Advertise: UGC viability, policy risk.
6. COD Feasibility: ease of delivery, return risk.
7. Competition: is it widely sold by others?
8. Saturation: availability in physical retail (OXXO, Walmart).
9. Risk Level: shipping size, breakage, health claims.
10. Scaling Potential: longevity and mass appeal.

RULES:
- Be decisive and commercially honest.
- Hooks must be in authentic Mexican Spanish, natural and spoken, not translated.
- Never invent supplier costs.
- Scores are 1-10. overall_score is 1-10 (average or weighted).
- Verdict must be exactly "WIN", "TEST", or "AVOID".

OUTPUT FORMAT:
Return ONLY a valid JSON object, no markdown fences and no commentary, matching exactly:
{
  "overall_score": 0,
  "verdict": "TEST",
  "checklist": {
    "wow_effect": { "score": 0, "reason": "" },
    "clear_problem": { "score": 0, "reason": "" },
    "demand_potential": { "score": 0, "reason": "" },
    "profit_margin": { "score": 0, "reason": "" },
    "easy_to_advertise": { "score": 0, "reason": "" },
    "cod_feasibility": { "score": 0, "reason": "" },
    "competition": { "score": 0, "reason": "" },
    "saturation": { "score": 0, "reason": "" },
    "risk_level": { "score": 0, "reason": "" },
    "scaling_potential": { "score": 0, "reason": "" }
  },
  "strengths": ["", ""],
  "weaknesses": ["", ""],
  "marketing_angles": [
    { "angle_name": "", "hook_spanish_mx": "", "core_message": "" }
  ],
  "final_recommendation": ""
}`;
