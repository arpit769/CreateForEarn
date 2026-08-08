import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')
  const error = searchParams.get('error')
  const error_code = searchParams.get('error_code')

  if (error || error_code) {
    if (next === '/reset-password' || error_code === 'otp_expired' || type === 'recovery') {
      return NextResponse.redirect(`${origin}/signup?error=otp_expired&tab=forgot`)
    }
    return NextResponse.redirect(`${origin}/signup?error=${error_code || error}`)
  }

  const supabase = await createClient()

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      if (next === '/reset-password') {
        return NextResponse.redirect(`${origin}${next}`)
      }
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/signup?confirmed=true`)
    } else {
      if (next === '/reset-password') {
        return NextResponse.redirect(`${origin}/signup?error=otp_expired&tab=forgot`)
      } else {
        // Cross-device confirmation: the email was verified on the auth server, redirect to login
        return NextResponse.redirect(`${origin}/signup?confirmed=true`)
      }
    }
  }

  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!verifyError) {
      if (type === 'recovery' || next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/signup?confirmed=true`)
    } else {
      if (type === 'recovery' || next === '/reset-password') {
        return NextResponse.redirect(`${origin}/signup?error=otp_expired&tab=forgot`)
      } else {
        return NextResponse.redirect(`${origin}/signup?confirmed=true`)
      }
    }
  }

  if (next === '/reset-password') {
    return NextResponse.redirect(`${origin}/signup?error=otp_expired&tab=forgot`)
  }

  // If email confirmation reached here without explicit error, redirect to login
  return NextResponse.redirect(`${origin}/signup?confirmed=true`)
}
