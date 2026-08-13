import { NextResponse } from 'next/server';
import { getAnalysisSettings } from '../../../../lib/ai/settings';
import { createChatCompletion, MissingApiKeyError } from '../../../../lib/ai/openrouter';
import {
  AnalysisParseError,
  interpolatePrompt,
  parseAnalysisResult,
} from '../../../../lib/ai/analysis';
import { shopifyGraphqlClient } from '../../../../lib/shopify/admin';

/**
 * POST /api/ai/analyze
 *
 * Body: { productId?: string, productData: {...} }
 *
 * Loads the operator's saved prompt and model, substitutes the product data
 * into the template, calls the model through OpenRouter and returns the parsed
 * analysis. The API key is resolved server-side and never appears in the
 * response.
 *
 * Behind the session cookie via proxy.ts, like the rest of the dashboard API.
 */

export const maxDuration = 120;

interface ProductData {
  title?: string;
  description?: string;
  supplierCost?: string | number | null;
  sellingPrice?: string | number | null;
  targetMarket?: string;
}

/** Strip HTML so the model receives readable text, not markup noise. */
function htmlToText(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/li|\/h[1-6])\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toValue(value: string | number | null | undefined, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

/**
 * Pull title, description and price straight from Shopify.
 *
 * The product list endpoint deliberately omits descriptions to keep its payload
 * small, so when the caller passes a productId we fetch the detail here rather
 * than making the browser carry it. Returns null if the lookup fails - analysis
 * then proceeds with whatever the client supplied.
 */
async function fetchProductFromShopify(productId: string) {
  try {
    const data = await shopifyGraphqlClient(
      `query NexmxAnalyzeProduct($id: ID!) {
        product(id: $id) {
          title
          descriptionHtml
          priceRangeV2 { minVariantPrice { amount currencyCode } }
        }
      }`,
      { id: productId }
    );

    const product = data?.product;
    if (!product) return null;

    return {
      title: product.title as string,
      description: (product.descriptionHtml as string) ?? '',
      sellingPrice: product.priceRangeV2?.minVariantPrice?.amount ?? null,
    };
  } catch (error) {
    console.error('Could not fetch product detail from Shopify:', error);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { productId?: string; productData?: ProductData };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    );
  }

  const productData: ProductData = { ...(body.productData ?? {}) };

  // Enrich from Shopify when we have an ID but no description to reason about.
  if (body.productId && !productData.description) {
    const fetched = await fetchProductFromShopify(body.productId);
    if (fetched) {
      productData.title = productData.title || fetched.title;
      productData.description = fetched.description;
      productData.sellingPrice = productData.sellingPrice ?? fetched.sellingPrice;
    }
  }

  if (!productData.title) {
    return NextResponse.json(
      { success: false, error: 'productData.title est requis.' },
      { status: 400 }
    );
  }

  const settings = await getAnalysisSettings();

  const rawDescription = toValue(productData.description, '');
  const description = rawDescription
    ? htmlToText(rawDescription).slice(0, 6000)
    : 'No description provided.';

  const prompt = interpolatePrompt(settings.systemPrompt, {
    product_title: toValue(productData.title, 'Unknown'),
    product_description: description,
    supplier_cost: toValue(productData.supplierCost, 'Unknown'),
    selling_price: toValue(productData.sellingPrice, 'Suggest one'),
    target_market: toValue(productData.targetMarket, 'Mexico'),
  });

  try {
    const raw = await createChatCompletion({
      model: settings.model,
      // The configured prompt carries the full instruction set; the user turn
      // just triggers the run, so a custom prompt stays fully in control.
      systemPrompt: prompt,
      userPrompt:
        'Analyze the product described above and return only the JSON object.',
      temperature: 0.4,
      jsonMode: true,
    });

    const analysis = parseAnalysisResult(raw);

    return NextResponse.json({
      success: true,
      productId: body.productId ?? null,
      model: settings.model,
      analysis,
    });
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'MISSING_API_KEY' },
        { status: 400 }
      );
    }

    if (error instanceof AnalysisParseError) {
      // Raw output goes to the server log only - it can be long and messy.
      console.error('Analysis parse failure. Raw model output:', error.raw);
      return NextResponse.json(
        { success: false, error: error.message, code: 'INVALID_MODEL_OUTPUT' },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error('Analysis failed:', error);

    return NextResponse.json(
      { success: false, error: message, code: 'PROVIDER_ERROR' },
      { status: 502 }
    );
  }
}
