// timeflow-next/middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This dynamically finds the correct cookie, validates the JWT, and refreshes if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const PUBLIC_PATHS = ["/", "/login", "/register"]
  const path = req.nextUrl.pathname

  if (!PUBLIC_PATHS.includes(path) && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("next", path)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}