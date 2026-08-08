'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '../signup/actions';
import { EyeOff, Eye, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-blue)', marginBottom: '16px' }}>
            <Lock size={32} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Set new password
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Please choose a strong password that you haven't used before.
          </p>
        </div>

        <form 
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setMessage(null);
            setIsPending(true);

            const formData = new FormData(e.currentTarget);
            if (formData.get('password') !== formData.get('confirmPassword')) {
              setError("Passwords do not match");
              setIsPending(false);
              return;
            }

            try {
              const res = await updatePassword(formData);
              if (res?.error) {
                setError(res.error);
                setIsPending(false);
              } else if (res?.success) {
                setMessage("Password updated successfully! Redirecting...");
                setIsPending(false);
                setTimeout(() => {
                  router.push('/dashboard');
                }, 2000);
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
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ 
              padding: '14px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              color: '#22c55e', 
              borderRadius: '8px', 
              fontSize: '13px', 
              border: '1px solid rgba(34, 197, 94, 0.2)' 
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>New Password <span style={{color: '#ef4444'}}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Enter new password" 
                minLength={8} 
                style={{ 
                  width: '100%', 
                  backgroundColor: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '8px', 
                  padding: '12px 40px 12px 14px', 
                  color: 'var(--text-primary)', 
                  fontSize: '14px', 
                  outline: 'none', 
                  transition: 'border 0.2s, background-color 0.2s' 
                }} 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '2px' }}>
              Password must be at least 8 characters.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Confirm Password <span style={{color: '#ef4444'}}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="confirmPassword" 
                placeholder="Confirm your password" 
                style={{ 
                  width: '100%', 
                  backgroundColor: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '8px', 
                  padding: '12px 40px 12px 14px', 
                  color: 'var(--text-primary)', 
                  fontSize: '14px', 
                  outline: 'none', 
                  transition: 'border 0.2s, background-color 0.2s' 
                }} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending} 
            style={{ 
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
          >
            {isPending ? 'Updating...' : <><Lock size={16} /> Reset Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
