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
  query NexmxStoreProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
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

  try {
    const data = await shopifyGraphqlClient(PRODUCTS_QUERY, { first, after });

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
