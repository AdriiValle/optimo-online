import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

function homeFor(role: UserRole, athleteId: string | null) {
  if (role === "admin") return "/panel";
  if (role === "nutritionist") return "/nutricion";
  return `/a/${athleteId}`;
}

const NUTRITIONIST_BLOCKED = ["/a/", "/ajustes", "/api/diaries", "/api/integrations"];

function isOwnAccountApi(pathname: string) {
  return pathname === "/api/me" || pathname.startsWith("/api/me/");
}

function nutritionistOwnAccountApi(pathname: string) {
  return pathname.startsWith("/api/me/password") || pathname.startsWith("/api/me/username");
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/escudos/") ||
    pathname === "/logo-optimo.png" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png" ||
    pathname === "/favicon.ico";

  const session = req.auth;
  if (isPublic) {
    if (pathname.startsWith("/login") && session?.user) {
      return NextResponse.redirect(new URL(homeFor(session.user.role, session.user.athleteId), req.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  const isNutritionArea = pathname === "/nutricion" || pathname.startsWith("/nutricion/") || pathname.startsWith("/api/nutrition");
  if (isNutritionArea && session.user.role !== "nutritionist") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (session.user.role === "nutritionist" && NUTRITIONIST_BLOCKED.some((p) => pathname.startsWith(p))) {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (session.user.role === "nutritionist" && isOwnAccountApi(pathname) && !nutritionistOwnAccountApi(pathname)) {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (pathname.startsWith("/panel") && session.user.role !== "admin") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (pathname.startsWith("/api/admin") && session.user.role !== "admin") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (isOwnAccountApi(pathname) && session.user.role !== "athlete" && session.user.role !== "admin" && session.user.role !== "nutritionist") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (pathname === "/ajustes" && session.user.role === "admin") {
    return NextResponse.redirect(new URL("/panel/ajustes", req.url));
  }

  if (pathname === "/ajustes" && session.user.role === "athlete") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/panel/ajustes") && session.user.role !== "admin") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  const athletePage = pathname.match(/^\/a\/([^/]+)/);
  if (athletePage && session.user.role === "athlete" && athletePage[1] !== session.user.athleteId) {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  const athleteApi = pathname.match(/^\/api\/athletes\/([^/]+)/);
  if (athleteApi && session.user.role === "athlete" && athleteApi[1] !== session.user.athleteId) {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (pathname === "/api/athletes" && session.user.role !== "admin") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|logo-optimo\\.png).*)"]
};
