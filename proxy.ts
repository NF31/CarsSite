import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;
  const userRole = user?.role;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");

  // Protection des routes dashboard et admin
  if (isOnDashboard || isOnAdmin) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Vérification stricte du rôle pour les routes admin
    if (isOnAdmin) {
      if (!userRole || userRole !== "ADMIN") {
        // Rediriger vers la page d'accès refusé si non-admin tente d'accéder à /admin
        return NextResponse.redirect(new URL("/access-denied", req.url));
      }
    }

    // Les admins peuvent accéder aux deux espaces, pas de redirection
  }

  // Si déjà connecté, rediriger depuis login/register vers le dashboard par défaut
  if (isLoggedIn) {
    if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")) {
      // Par défaut, rediriger vers le dashboard client (les admins peuvent ensuite aller vers /admin/dashboard)
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

