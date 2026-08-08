import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (
    (request.nextUrl.searchParams.has('code') || 
     request.nextUrl.searchParams.has('token_hash') ||
     request.nextUrl.searchParams.has('error') ||
     request.nextUrl.searchParams.has('error_code')) &&
    !request.nextUrl.pathname.startsWith('/api/auth/callback')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/api/auth/callback'
    if (!url.searchParams.has('next')) {
      url.searchParams.set('next', '/reset-password')
    }
    return NextResponse.redirect(url)
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/signup') || request.nextUrl.pathname.startsWith('/login')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/analytics') || request.nextUrl.pathname.startsWith('/moderation')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/signup'
    return NextResponse.redirect(url)
  }

  const hasAuthParams = request.nextUrl.searchParams.has('error') || 
                        request.nextUrl.searchParams.has('confirmed') || 
                        request.nextUrl.searchParams.has('tab')

  if (isAuthRoute && user && !hasAuthParams) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
