import { sanitizeShopDomain } from './oauth';

/**
 * Shopify GraphQL Admin API version. Unchanged.
 */
export const SHOPIFY_API_VERSION = '2026-07';

/**
 * Manual, single-store credential mode.
 *
 * Credentials come from server-side environment variables only:
 *   SHOPIFY_STORE_DOMAIN
 *   SHOPIFY_ADMIN_ACCESS_TOKEN
 *
 * No database is involved in resolving Shopify credentials - not the local
 * SQLite file, not Turso. The OAuth implementation (lib/shopify/oauth.ts,
 * /api/shopify/auth, /api/shopify/callback) is left intact and untouched for
 * later use, but its stored credentials are deliberately not consulted here:
 * manual mode stands on its own.
 */
export type ShopifyAuthMode = 'manual';

export interface ShopifyCredentials {
  shop: string;
  /** Server-side only. Never serialized into an API response. */
  accessToken: string;
  mode: ShopifyAuthMode;
}

/**
 * Non-sensitive connection description, safe to return to the browser.
 * Deliberately has no token field so it cannot leak by accident.
 */
export interface ShopifyConnectionInfo {
  connected: boolean;
  shop: string | null;
  mode: ShopifyAuthMode | null;
  /**
   * Set when the configuration is present but wrong (e.g. a malformed
   * SHOPIFY_STORE_DOMAIN), as opposed to simply absent. Describes config shape
   * only - never a credential value.
   */
  error?: string;
}

/**
 * Resolve Shopify credentials from server-side environment variables.
 *
 * Returns null when the store is not configured. Throws only when the
 * configuration is present but invalid, so a typo surfaces as a clear error
 * instead of a silent "not connected".
 *
 * `process.env` is only readable in the Node.js server runtime; because
 * SHOPIFY_ADMIN_ACCESS_TOKEN is not prefixed with NEXT_PUBLIC_, Next.js will
 * never inline it into a client bundle.
 */
export async function getShopifyCredentials(): Promise<ShopifyCredentials | null> {
  const rawShop = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();

  if (!rawShop || !accessToken) {
    return null;
  }

  // Normalize and validate: accepts "store" or "store.myshopify.com", rejects
  // anything else. Prevents a malformed value from pointing Admin API calls at
  // an arbitrary host. Lowercased first so the resolved domain is stable
  // regardless of how the variable was typed.
  const shop = sanitizeShopDomain(rawShop.toLowerCase());
  if (!shop) {
    throw new Error(
      'SHOPIFY_STORE_DOMAIN is not a valid *.myshopify.com domain. ' +
        'Expected e.g. "your-store.myshopify.com".'
    );
  }

  return { shop, accessToken, mode: 'manual' };
}

/**
 * Token-free connection summary for API responses and UI state.
 */
export async function getShopifyConnectionInfo(): Promise<ShopifyConnectionInfo> {
  try {
    const credentials = await getShopifyCredentials();
    if (!credentials) {
      return { connected: false, shop: null, mode: null };
    }
    return { connected: true, shop: credentials.shop, mode: credentials.mode };
  } catch (error: any) {
    // Misconfiguration must not be reported as plain "not configured" - that
    // sends operators looking in the wrong place.
    console.error('Failed to resolve Shopify connection info', error);
    return {
      connected: false,
      shop: null,
      mode: null,
      error: error?.message ?? 'Configuration Shopify invalide.',
    };
  }
}

/**
 * Call the Shopify GraphQL Admin API. GraphQL only - there is no REST path.
 */
export async function shopifyGraphqlClient(query: string, variables: any = {}) {
  const credentials = await getShopifyCredentials();

  if (!credentials) {
    throw new Error(
      'Shopify non configuré. Définissez SHOPIFY_STORE_DOMAIN et SHOPIFY_ADMIN_ACCESS_TOKEN.'
    );
  }

  const { shop, accessToken } = credentials;
  const endpoint = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  // Shopify returns 401/402/403/429 with a non-GraphQL body. Parsing that as a
  // GraphQL envelope produced a confusing "Unknown error"; surface the status.
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    // Truncated so an unexpected HTML error page cannot flood the logs.
    throw new Error(
      `Shopify API request failed (HTTP ${response.status}): ${detail.slice(0, 200)}`
    );
  }

  const data = await response.json();

  if (data.errors) {
    console.error('Shopify GraphQL Errors:', data.errors);
    throw new Error(`Shopify API Error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  return data.data;
}

/**
 * Harmless read-only query used to verify the configured domain and token
 * actually work. Returns no credential material.
 */
export async function testShopifyConnection() {
  const data = await shopifyGraphqlClient(`
    query NexmxConnectionTest {
      shop {
        name
        myshopifyDomain
        primaryDomain {
          url
        }
      }
    }
  `);

  return data.shop as {
    name: string;
    myshopifyDomain: string;
    primaryDomain: { url: string } | null;
  };
}
