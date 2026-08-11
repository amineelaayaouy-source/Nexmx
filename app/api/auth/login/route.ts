import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-fallback-key-change-in-production'
);

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

    // Generate JWT
    const token = await new SignJWT({ admin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // Valid for 30 days
      .sign(JWT_SECRET);

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
