'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message || 'Login failed' }
  }

  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
        referral_code_used: (formData.get('referralCode') as string || '').trim().toUpperCase() || null,
      }
    }
  }

  const password = data.password;
  
  if (password.length < 8 || password.length > 20) {
    return { error: 'Password must be between 8 and 20 characters.' }
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return { error: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    console.error("SUPABASE SIGNUP ERROR:", error);
    
    let errMsg = "An unknown error occurred during signup.";
    if (error.message) {
      errMsg = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Try to extract anything we can
      const keys = Object.getOwnPropertyNames(error);
      if (keys.length > 0) {
        errMsg = "Error details: " + JSON.stringify(error, keys);
      }
    } else {
      errMsg = String(error);
    }
    
    return { error: errMsg };
  }

  if (authData.user) {
    const identities = authData.user.identities || []
    if (identities.length === 0) {
      return { error: 'An account with this email already exists. Please switch to Sign In.' }
    }
  }

  // If email confirmation is enabled, session will be null and the user must verify their email.
  if (!authData.session) {
    return { 
      success: true, 
      message: 'Signup successful! Please check your email inbox to confirm your account.' 
    }
  }

  return { success: true }
}

export async function requestPasswordReset(formData: FormData, origin: string) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password reset link has been sent to your email.' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Password is required' }
  }

  if (password.length < 8 || password.length > 20) {
    return { error: 'Password must be between 8 and 20 characters.' }
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return { error: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
