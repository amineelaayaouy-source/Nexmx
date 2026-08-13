import { NextResponse } from 'next/server';
import {
  getShopifyConnectionInfo,
  shopifyGraphqlClient,
} from '../../../../lib/shopify/admin';

/**
 * GET /api/shopify/products?limit=50&after=<cursor>
 *
 * Lists products from the configured store via the GraphQL Admin API.
 * Read-only. Runs server-side with the manual credentials, so the access token
 * never reaches the browser - the client only ever sees product data.
 *
 * Behind the session cookie via proxy.ts, like the rest of the dashboard API.
 */

const PRODUCTS_QUERY = `
  query NexmxStoreProducts(
    $first: Int!
    $after: String
    $query: String
    $sortKey: ProductSortKeys!
    $reverse: Boolean!
  ) {
    products(
      first: $first
      after: $after
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      edges {
        node {
          id
          title
          handle
          status
          totalInventory
          updatedAt
          featuredMedia {
            preview {
              image {
                url
                altText
              }
            }
          }
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          variantsCount {
            count
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * Turn free text from the search box into a Shopify search query.
 *
 * Shopify's search syntax gives meaning to quotes, parentheses, backslashes,
 * colons and a leading "-" (negation). Unbalanced input produces a GraphQL
 * error, so those characters are stripped rather than passed through - this is a
 * plain search box, not a query console.
 *
 * Bare terms already prefix-match ("supl" finds "Suplemento"), and a trailing
 * "*" makes that behaviour explicit while the user is still typing. Mid-word
 * matching is not supported by the Admin API, so "rginina" finds nothing.
 */
function buildSearchQuery(raw: string): string | null {
  const cleaned = raw
    .replace(/[\\"()]/g, ' ')
    .replace(/:/g, ' ')
    .split(/\s+/)
    .map((term) => term.replace(/^-+/, '').trim())
    .filter(Boolean);

  if (cleaned.length === 0) return null;

  return cleaned
    .map((term) => (term.endsWith('*') ? term : `${term}*`))
    .join(' ');
}

interface ProductNode {
  id: string;
  title: string;
  handle: string;
  status: string;
  totalInventory: number | null;
  updatedAt: string;
  featuredMedia?: { preview?: { image?: { url?: string; altText?: string } } } | null;
  priceRangeV2?: {
    minVariantPrice?: { amount?: string; currencyCode?: string };
    maxVariantPrice?: { amount?: string; currencyCode?: string };
  } | null;
  variantsCount?: { count?: number } | null;
}

export async function GET(request: Request): Promise<Response> {
  const connection = await getShopifyConnectionInfo();

  if (!connection.connected) {
    return NextResponse.json(
      {
        success: false,
        error:
          connection.error ??
          'Shopify non configuré. Définissez SHOPIFY_STORE_DOMAIN et SHOPIFY_ADMIN_ACCESS_TOKEN.',
      },
      { status: connection.error ? 500 : 400 }
    );
  }

  const { searchParams } = new URL(request.url);

  // Clamp to the Admin API's per-page maximum, and ignore junk input.
  const requested = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const first = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), 250)
    : 50;
  const after = searchParams.get('after') || null;

  const rawSearch = (searchParams.get('q') ?? '').trim().slice(0, 200);
  const query = rawSearch ? buildSearchQuery(rawSearch) : null;

  // Relevance ordering only makes sense with a search term; browsing the full
  // catalogue stays newest-updated-first. reverse must be false for RELEVANCE,
  // otherwise the least relevant results come back first.
  const sortKey = query ? 'RELEVANCE' : 'UPDATED_AT';
  const reverse = !query;

  try {
    const data = await shopifyGraphqlClient(PRODUCTS_QUERY, {
      first,
      after,
      query,
      sortKey,
      reverse,
    });

    const edges = data.products.edges as { node: ProductNode }[];

    const products = edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      status: node.status,
      totalInventory: node.totalInventory,
      updatedAt: node.updatedAt,
      imageUrl: node.featuredMedia?.preview?.image?.url ?? null,
      imageAlt: node.featuredMedia?.preview?.image?.altText ?? null,
      variantsCount: node.variantsCount?.count ?? 0,
      minPrice: node.priceRangeV2?.minVariantPrice?.amount ?? null,
      maxPrice: node.priceRangeV2?.maxVariantPrice?.amount ?? null,
      currency: node.priceRangeV2?.minVariantPrice?.currencyCode ?? null,
    }));

    return NextResponse.json({
      success: true,
      shop: connection.shop,
      query: rawSearch || null,
      products,
      pageInfo: data.products.pageInfo,
    });
  } catch (error) {
    console.error('Failed to fetch Shopify products:', error);
    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { success: false, error: `Impossible de récupérer les produits: ${message}` },
      { status: 502 }
    );
  }
}
