import { getDbConnection } from '../../db';

export async function getShopifyCredentials() {
  const db = getDbConnection();
  const result = await db.execute('SELECT * FROM settings WHERE key IN ("shopify_url", "shopify_token")');
  
  const settings = result.rows.reduce((acc: Record<string, string>, row: any) => {
    acc[row.key as string] = row.value as string;
    return acc;
  }, {});

  if (!settings.shopify_url || !settings.shopify_token) {
    return null;
  }

  return {
    shop: settings.shopify_url,
    accessToken: settings.shopify_token,
  };
}

export async function shopifyGraphqlClient(query: string, variables: any = {}) {
  const credentials = await getShopifyCredentials();
  
  if (!credentials) {
    throw new Error('Shopify not connected');
  }

  const { shop, accessToken } = credentials;
  const endpoint = `https://${shop}/admin/api/2024-01/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  if (data.errors) {
    console.error('Shopify GraphQL Errors:', data.errors);
    throw new Error(`Shopify API Error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  return data.data;
}
