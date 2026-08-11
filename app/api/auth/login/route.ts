import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getJwtSecret } from '../../../../lib/auth/jwt-secret';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Check against the environment variable (default: 'admin')
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (password !== correctPassword) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Resolve the JWT secret. No hardcoded/default fallback: if JWT_SECRET
    // is not configured, refuse to issue a token rather than signing with a
    // guessable value.
    let jwtSecret: Uint8Array;
    try {
      jwtSecret = getJwtSecret();
    } catch {
      console.error('Cannot sign session token: JWT_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Erreur de configuration du serveur' },
        { status: 500 }
      );
    }

    // Generate JWT
    const token = await new SignJWT({ admin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // Valid for 30 days
      .sign(jwtSecret);

    const response = NextResponse.json({ success: true });
    
    // Set HTTP-Only cookie
    response.cookies.set('nexmx_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
