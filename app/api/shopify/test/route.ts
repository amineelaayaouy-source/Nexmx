import { NextResponse } from 'next/server';
import {
  getShopifyConnectionInfo,
  testShopifyConnection,
} from '../../../../lib/shopify/admin';

/**
 * GET /api/shopify/test
 *
 * Verifies the manual Shopify configuration (SHOPIFY_STORE_DOMAIN +
 * SHOPIFY_ADMIN_ACCESS_TOKEN) with a harmless read-only GraphQL query.
 *
 * This route is not in the middleware's public allowlist, so it stays behind the
 * Nexmx session cookie like the rest of the dashboard API.
 *
 * The response contains the store domain and shop name only - never the token.
 */
export async function GET(): Promise<Response> {
  const connection = await getShopifyConnectionInfo();

  // Not configured, or configured with an invalid domain.
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

  try {
    const shop = await testShopifyConnection();

    return NextResponse.json({
      success: true,
      shop: {
        name: shop.name,
        domain: shop.myshopifyDomain,
        primaryUrl: shop.primaryDomain?.url ?? null,
      },
    });
  } catch (error: any) {
    console.error('Shopify connection test failed:', error);

    return NextResponse.json(
      {
        success: false,
        shop: { domain: connection.shop },
        error: `Échec de la connexion Shopify: ${error.message}`,
      },
      { status: 502 }
    );
  }
}
