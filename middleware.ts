import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/escudos/") ||
    pathname === "/logo-optimo.png";

  const session = req.auth;
  if (isPublic) {
    if (pathname.startsWith("/login") && session?.user) {
      const dest = session.user.role === "admin" ? "/panel" : `/a/${session.user.athleteId}`;
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/panel") && session.user.role !== "admin") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (pathname.startsWith("/api/admin") && session.user.role !== "admin") {
    return NextResponse.rewrite(new URL("/__not_found", req.url));
  }

  if (pathname.startsWith("/api/me") && session.user.role !== "athlete" && session.user.role !== "admin") {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
