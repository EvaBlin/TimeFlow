import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Пропускаем системные файлы Next.js и любые файлы с расширением (css, js, png и т.д.)
  // Это вернет стили, так как они не будут редиректиться на /login
  if (path.startsWith('/_next') || path.includes('.')) {
    return NextResponse.next();
  }

  // 2. Разрешаем доступ к публичным страницам
  if (PUBLIC_PATHS.includes(path)) return NextResponse.next();

  // 3. Проверка авторизации через куки
  const hasSessionCookie =
    req.cookies.has("sb-access-token") 
    req.cookies.has("sb:token") ||
    req.cookies.get("supabase-auth-token") !== undefined;

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/tools/:path*"]
};