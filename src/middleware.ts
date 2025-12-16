import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        
        // Rutas públicas que no requieren autenticación
        if (
          path.startsWith("/api/auth") ||
          path.startsWith("/api/test-db") ||
          path === "/login" ||
          path.startsWith("/music") ||
          path.startsWith("/videos") ||
          path.startsWith("/uploads") ||
          path.includes(".") // Archivos estáticos (imágenes, css, js)
        ) {
          return true;
        }

        // Para todo lo demás, requiere token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
