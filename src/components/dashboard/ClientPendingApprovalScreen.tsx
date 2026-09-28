'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, ShieldAlert, Building2, CheckCircle2, 
  Mail, Sparkles, RefreshCw, HelpCircle, LogOut, ArrowRight, Shield 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ClientPendingApprovalScreen({ profile }: { profile?: any }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/signup';
  };

  const brandName = profile?.full_name || 'Brand Partner';
  const email = profile?.email || 'N/A';

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Decorative Amber Banner */}
        <div style={{
          height: '6px',
          width: '100%',
          background: 'linear-gradient(90deg, #f59e0b, #eab308, #fbbf24)',
        }} />

        <div style={{ padding: '36px 32px' }}>
          {/* Status Badge & Icon Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#eab308',
              marginBottom: '18px',
              boxShadow: '0 8px 20px rgba(234, 179, 8, 0.15)'
            }}>
              <Clock size={36} className="animate-pulse" />
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              color: '#d97706',
              fontSize: '12.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
              Admin Verification Required
            </div>

            <h1 style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              marginBottom: '10px'
            }}>
              Brand Account Under Review
            </h1>

            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '520px'
            }}>
              Welcome to <strong style={{ color: 'var(--text-primary)' }}>CreateForEarn</strong>! As part of our trust & safety guidelines, every newly registered brand client is verified by the admin team before launching campaigns.
            </p>
          </div>

          {/* Account Overview Box */}
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px', marginBottom: '14px' }}>
              Registration Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Brand / Company</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{brandName}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact Email</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Checklist Info */}
          <div style={{
            background: 'rgba(234, 179, 8, 0.04)',
            borderRadius: '16px',
            border: '1px solid rgba(234, 179, 8, 0.15)',
            padding: '20px',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Shield size={18} style={{ color: '#eab308' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                What happens next?
              </div>
            </div>

            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              <li>An admin is reviewing your brand information to activate campaign creation privileges.</li>
              <li>Verification usually takes <strong>1 to 2 hours</strong> during standard review cycles.</li>
              <li>Once verified, your client dashboard will automatically unlock and give you instant access to post tasks on Reddit, YouTube, X, Quora, LinkedIn, and Instagram.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', smDirection: 'row', gap: '12px' } as any}>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Checking Approval...' : 'Check Approval Status'}
            </button>

            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
