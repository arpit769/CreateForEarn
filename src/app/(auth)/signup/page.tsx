'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { login, signup } from './actions';

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
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
              <img src="/logo.png" alt="CreateForEarn Logo" style={{ height: '72px', width: 'auto', objectFit: 'contain' }} />
              <div>
                CreateForEarn<br />
                <span style={{ color: 'var(--text-muted)', fontSize: '32px', display: 'block', marginTop: '4px' }}>
                  {isLogin ? 'Login' : 'Signup'}
                </span>
              </div>
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Floating Emojis (Reddit/Community Theme) */}
        {/* Alien/Snoo */}
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '15%', right: '20%' }}>
          <div style={{ fontSize: '48px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            👽
          </div>
        </motion.div>
        {/* Upvote */}
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} style={{ position: 'absolute', top: '25%', left: '10%' }}>
          <div style={{ fontSize: '42px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            ⬆️
          </div>
        </motion.div>
        {/* Coins/Karma */}
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }} style={{ position: 'absolute', top: '35%', right: '12%' }}>
          <div style={{ fontSize: '36px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            🪙
          </div>
        </motion.div>
        {/* Comments */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '25%', left: '15%' }}>
          <div style={{ fontSize: '40px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            💬
          </div>
        </motion.div>
        {/* Award */}
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }} style={{ position: 'absolute', top: '42%', left: '32%' }}>
           <div style={{ fontSize: '44px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
            🏆
           </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--bg-primary)', 
        padding: '64px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          
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
              style={{ marginBottom: '32px' }}
            >
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                {isLogin ? 'Sign in to your account to continue' : 'Join us and start earning today'}
              </p>
            </motion.div>
          </AnimatePresence>

          <button type="button" style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: 'var(--bg-elevated)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: '8px', 
            color: 'var(--text-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s, border 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C38.04 6.286 31.332 3 24 3C12.402 3 3 12.402 3 24s9.402 21 21 21s21-9.402 21-21c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.04 6.286 27.332 3 24 3C16.667 3 10.354 7.022 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 45c7.332 0 14.04-3.286 17.619-8.381l-6.529-5.114C32.181 34.618 28.324 36 24 36c-5.222 0-9.654-3.343-11.303-8l-6.571 4.819C10.354 40.978 16.667 45 24 45z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571v.001l6.529 5.114C41.528 35.143 45 29.98 45 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            {isLogin ? 'Login with Google' : 'Sign up with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }}></div>
            <span style={{ margin: '0 12px', color: 'var(--text-muted)', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }}></div>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login-form' : 'signup-form'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              action={async (formData: FormData) => {
                setError(null);
                setMessage(null);
                if (isLogin) {
                  const res = await login(formData);
                  if (res?.error) setError(res.error);
                } else {
                  const res = await signup(formData);
                  if (res?.error) setError(res.error);
                  if (res?.success) setMessage(res.success);
                }
              }}
            >
              {error && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {error}
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
                    <input type="text" name="fullName" placeholder="John Doe" style={{ 
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
                  <input type={showPassword ? "text" : "password"} name="password" placeholder={isLogin ? "Enter your password" : "Create a password"} style={{ 
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

              {isLogin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                  <Link href="#" style={{ color: 'var(--accent-blue)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
              )}

              <button type="submit" style={{ 
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
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {isLogin ? 'Sign in' : 'Sign up'} <ArrowRight size={16} />
              </button>
            </motion.form>
          </AnimatePresence>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
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
          </div>
        </div>
      </div>
    </div>
  );
}
