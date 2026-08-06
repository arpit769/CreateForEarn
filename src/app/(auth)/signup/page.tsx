'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, Eye, ArrowRight, User as UserIcon, ArrowUp, Coins, MessageSquare, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { login, signup } from './actions';

function AuthPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam === 'profile_not_found') {
      setError("Your login succeeded, but no profile was found in the database. Please contact an admin or make sure your database trigger completed successfully.");
    }
  }, [searchParams]);


  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
    }}>
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden md:flex" style={{
        flex: 1,
        backgroundColor: 'var(--bg-secondary)', // Uses theme secondary background
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Concentric circles background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at center, transparent 0%, transparent 15%, var(--border-subtle) 15.5%, transparent 16%, transparent 30%, var(--border-subtle) 30.5%, transparent 31%, transparent 45%, var(--border-subtle) 45.5%, transparent 46%, transparent 60%, var(--border-subtle) 60.5%, transparent 61%, transparent 75%, var(--border-subtle) 75.5%, transparent 76%)',
          backgroundSize: '100% 100%'
        }}></div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.4 }}
            style={{ zIndex: 10, textAlign: 'center', maxWidth: '80%' }}
          >
            <h2 style={{ 
              fontSize: '46px', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              textShadow: '0 4px 24px var(--hero-glow-4)',
              letterSpacing: '1px',
              lineHeight: '1.2',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <img src="/logo.png" alt="CreateForEarn Logo" style={{ height: '76px', width: '76px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
              <div>
                CreateForEarn
              </div>
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Floating Icons (Reddit/Community Theme) */}
        {/* Alien/Snoo equivalent */}
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '15%', right: '20%' }}>
          <div style={{ color: 'var(--text-muted)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            <UserIcon size={48} />
          </div>
        </motion.div>
        {/* Upvote */}
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} style={{ position: 'absolute', top: '25%', left: '10%' }}>
          <div style={{ color: 'var(--accent-orange)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            <ArrowUp size={42} />
          </div>
        </motion.div>
        {/* Coins/Karma */}
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }} style={{ position: 'absolute', top: '35%', right: '12%' }}>
          <div style={{ color: 'var(--accent-cyan)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            <Coins size={36} />
          </div>
        </motion.div>
        {/* Comments */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '25%', left: '15%' }}>
          <div style={{ color: 'var(--accent-blue)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            <MessageSquare size={40} />
          </div>
        </motion.div>
        {/* Award */}
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }} style={{ position: 'absolute', top: '42%', left: '32%' }}>
           <div style={{ color: 'var(--accent-green)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            <Trophy size={44} />
           </div>
        </motion.div>
        {/* Floating Dollars */}
        <motion.div animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }} style={{ position: 'absolute', top: '15%', right: '35%' }}>
          <div style={{ color: '#10b981', filter: 'drop-shadow(0 4px 12px rgba(16,185,129,0.25))', fontSize: '56px', fontWeight: 900, fontFamily: 'monospace', userSelect: 'none' }}>
            $
          </div>
        </motion.div>
        <motion.div animate={{ y: [0, 12, 0], rotate: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '30%', right: '45%' }}>
          <div style={{ color: '#10b981', filter: 'drop-shadow(0 4px 12px rgba(16,185,129,0.25))', fontSize: '38px', fontWeight: 900, fontFamily: 'monospace', userSelect: 'none' }}>
            $
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--bg-primary)', 
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: 'auto' }}>
          
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '48px', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
             ← Back to Home
          </Link>

          <AnimatePresence mode="wait">
            <motion.div 
              key={isLogin ? 'login-header' : 'signup-header'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: '24px' }}
            >
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                {isLogin ? 'Sign in to your account to continue' : 'Join us and start earning today'}
              </p>
            </motion.div>
          </AnimatePresence>

          {!isLogin && (
            <div style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.15)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#fbbf24',
              lineHeight: '1.5'
            }}>
              <p style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Reddit Account Requirements:
              </p>
              <ul style={{ paddingLeft: '18px', margin: 0, listStyleType: 'disc' }}>
                <li>Minimum account age: 20 days</li>
                <li>Minimum account karma: 50</li>
              </ul>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login-form' : 'signup-form'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setMessage(null);
                setIsPending(true);
                const formData = new FormData(e.currentTarget);
                try {
                  if (isLogin) {
                    const res = await login(formData);
                    if (res?.error) {
                      setError(res.error);
                      setIsPending(false);
                    } else if (res?.success) {
                      router.push('/dashboard');
                      // Keep isPending true so the overlay stays visible during redirect
                    }
                  } else {
                    if (formData.get('password') !== formData.get('confirmPassword')) {
                      setError("Passwords do not match");
                      setIsPending(false);
                      return;
                    }
                    const res = await signup(formData);
                    if (res?.error) {
                      setError(res.error);
                      setIsPending(false);
                    } else if (res?.success) {
                      if (res.message) {
                        setMessage(res.message);
                        setIsPending(false);
                      } else {
                        router.push('/dashboard');
                        // Keep isPending true so the overlay stays visible during redirect
                      }
                    }
                  }
                } catch (e) {
                  setError("An unexpected error occurred: " + String(e));
                  setIsPending(false);
                }
              }}


            >
              {error && (
                <div style={{ 
                  padding: '14px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  lineHeight: '1.4'
                }}>
                  <div>
                    {typeof error === 'string' ? error : JSON.stringify(error)}
                  </div>
                  {typeof error === 'string' && error.toLowerCase().includes('rate limit') && (
                    <div style={{ 
                      marginTop: '6px', 
                      paddingTop: '8px', 
                      borderTop: '1px solid rgba(239, 68, 68, 0.2)', 
                      color: 'var(--text-secondary)',
                      fontSize: '12px'
                    }}>
                      <strong style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        🔧 Developer Note:
                      </strong>
                      Supabase restricts email signups using the built-in SMTP to 3 per hour. To resolve this:
                      <ol style={{ margin: '6px 0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Go to your <strong>Supabase Dashboard</strong>.</li>
                        <li>Navigate to <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Email</strong>.</li>
                        <li>Disable <strong>Confirm email</strong> (this allows automatic login on signup) or adjust the <strong>Rate Limits</strong>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
              {message && (
                <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  {message}
                </div>
              )}

              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Full Name <span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" name="fullName" placeholder="Enter your full name" style={{ 
                      width: '100%', 
                      backgroundColor: 'var(--bg-elevated)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '8px', 
                      padding: '12px 14px', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px', 
                      outline: 'none', 
                      transition: 'border 0.2s, background-color 0.2s' 
                    }} required 
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-medium)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-subtle)';
                      e.target.style.backgroundColor = 'var(--bg-elevated)';
                    }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Email <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type="email" name="email" placeholder="Enter your email address" style={{ 
                    width: '100%', 
                    backgroundColor: 'var(--bg-elevated)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '8px', 
                    padding: '12px 14px', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px', 
                    outline: 'none', 
                    transition: 'border 0.2s, background-color 0.2s' 
                  }} required 
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--border-medium)';
                    e.target.style.backgroundColor = 'var(--bg-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
                  }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Password <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"} name="password" placeholder={isLogin ? "Enter your password" : "Create a password"} minLength={8} maxLength={20} style={{ 
                    width: '100%', 
                    backgroundColor: 'var(--bg-elevated)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '8px', 
                    padding: '12px 40px 12px 14px', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px', 
                    outline: 'none', 
                    transition: 'border 0.2s, background-color 0.2s' 
                  }} required 
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--border-medium)';
                    e.target.style.backgroundColor = 'var(--bg-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
                  }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {!isLogin && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '2px' }}>
                    Password must be 8-20 characters and contain at least:
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      <li>1 uppercase & 1 lowercase letter</li>
                      <li>1 number & 1 special character</li>
                    </ul>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Confirm Password <span style={{color: '#ef4444'}}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm your password" style={{ 
                      width: '100%', 
                      backgroundColor: 'var(--bg-elevated)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '8px', 
                      padding: '12px 40px 12px 14px', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px', 
                      outline: 'none', 
                      transition: 'border 0.2s, background-color 0.2s' 
                    }} required 
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-medium)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-subtle)';
                      e.target.style.backgroundColor = 'var(--bg-elevated)';
                    }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Referral Code
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, fontStyle: 'italic' }}>(optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" name="referralCode" placeholder="Enter referral code if you have one" maxLength={8} style={{ 
                      width: '100%', 
                      backgroundColor: 'var(--bg-elevated)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '8px', 
                      padding: '12px 14px', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px', 
                      outline: 'none', 
                      transition: 'border 0.2s, background-color 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      fontFamily: 'monospace'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-medium)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-subtle)';
                      e.target.style.backgroundColor = 'var(--bg-elevated)';
                    }}
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                  <Link href="#" style={{ color: 'var(--accent-blue)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
              )}

              <button type="submit" disabled={isPending} style={{ 
                marginTop: '8px', 
                padding: '14px', 
                width: '100%', 
                backgroundColor: 'var(--text-primary)', 
                color: 'var(--bg-primary)', 
                border: 'none', 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => { if (!isPending) e.currentTarget.style.opacity = '0.8' }}
              onMouseOut={(e) => { if (!isPending) e.currentTarget.style.opacity = '1' }}
              >
                {isPending ? (
                  isLogin ? 'Signing in...' : 'Creating account...'
                ) : (
                  <>{isLogin ? 'Sign in' : 'Sign up'} <ArrowRight size={16} /></>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <div style={{ marginTop: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                For any query join our discord:
              </p>

              <a 
                href="https://discord.gg/5qu5s87kKu" 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '10px',
                  width: '100%',
                  backgroundColor: '#5865F2', 
                  color: '#ffffff', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  textDecoration: 'none', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  boxShadow: '0 4px 14px rgba(88, 101, 242, 0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4752C4';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(88, 101, 242, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#5865F2';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(88, 101, 242, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="20" height="15" viewBox="0 0 127.14 96.36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#ffffff" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.09-.09C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91,65.69,84.69,65.69Z"/>
                </svg>
                <span>Join our Discord</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen 'Please Wait' overlay loader */}
      {isPending && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          gap: '16px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid var(--accent-blue)',
            borderRadius: '50%',
            animation: 'spin 1s infinite linear'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700, margin: 0 }}>Please wait</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            {isLogin ? 'Signing you in...' : 'Setting up your profile...'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-muted)'
      }}>
        Loading...
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}

