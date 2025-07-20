import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Protection des routes admin
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Protection de la page viewer
    if (pathname.startsWith('/viewer')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Toujours autoriser les routes publiques
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/api/auth')) {
          return true;
        }
        
        // Autoriser si l'utilisateur est connecté
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/viewer/:path*'],
}; 