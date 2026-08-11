import { NextResponse } from 'next/server';
import { shopifyGraphqlClient, getShopifyCredentials } from '../../../lib/shopify/admin';

export async function POST(request: Request) {
  try {
    const { url, market, language } = await request.json();
    
    // Check connection using the new helper
    const credentials = await getShopifyCredentials();

    if (!credentials) {
      return NextResponse.json({ 
        success: false, 
        error: "Veuillez connecter votre boutique Shopify dans les paramètres d'abord." 
      }, { status: 400 });
    }

    // Instead of artificial delay, we could do a real GraphQL call if we parse the ID from URL.
    // For now, let's just make a simple test query to verify the token works, 
    // then return the mock extraction result as per instructions "keep existing functionality".
    
    try {
      // Test query to ensure token is valid
      await shopifyGraphqlClient(`
        query {
          shop {
            name
          }
        }
      `);
    } catch (graphqlError: any) {
      console.error("GraphQL Test Failed:", graphqlError);
      return NextResponse.json({ 
        success: false, 
        error: `Erreur de connexion Shopify: ${graphqlError.message}` 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Produit extrait avec succès depuis Shopify",
      data: {
        url,
        market,
        language,
        status: "importé",
        mock_product_id: "gid://shopify/Product/1234567890" // Still keeping mock as instructed
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
