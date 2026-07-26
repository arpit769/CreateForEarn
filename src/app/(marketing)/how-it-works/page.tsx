'use client';

import { UserCheck, CheckSquare, Search, DollarSign } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px', textAlign: 'justify', color: 'var(--text-secondary)' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '48px' }}>
        How It Works
      </h1>
      
      <p style={{ fontSize: '18px', lineHeight: 1.8, marginBottom: '64px' }}>
        Getting started with CreateForEarn is simple and straightforward. Our platform is designed to seamlessly integrate into your daily Reddit routine, 
        transforming the time you spend browsing and engaging into a profitable endeavor. Follow our step-by-step pipeline to start earning today.
      </p>

      {/* Flowchart Diagram */}
      <div style={{ background: 'var(--hero-glow-1)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '64px 32px', marginBottom: '64px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '48px' }}>The Earning Pipeline</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '160px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={28} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '15px' }}>1. Register</h3>
            <p style={{ fontSize: '12px' }}>Sign up and link your Reddit account for verification.</p>
          </div>

          <div style={{ color: 'var(--text-muted)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '160px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={28} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '15px' }}>2. Find Tasks</h3>
            <p style={{ fontSize: '12px' }}>Browse tasks matched to your account's subreddits.</p>
          </div>

          <div style={{ color: 'var(--text-muted)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '160px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={28} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '15px' }}>3. Submit Proof</h3>
            <p style={{ fontSize: '12px' }}>Complete the engagement and submit the link.</p>
          </div>

          <div style={{ color: 'var(--text-muted)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '160px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={28} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '15px' }}>4. Get Paid</h3>
            <p style={{ fontSize: '12px' }}>Receive funds directly to your preferred wallet.</p>
          </div>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <UserCheck size={28} color="var(--accent-blue)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Initial Registration</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            The first step is registering and linking your Reddit account. We review your account to ensure it meets our quality and age standards. Once approved, you are fully onboarded and ready to start taking on tasks. This verification step is critical to maintaining high standards.
          </p>
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <Search size={28} color="var(--accent-purple)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Task Discovery</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            After registration, you can browse a tailored list of tasks dynamically matched to the subreddits you are already active in or are qualified for based on your history. You simply review the available opportunities, claim the ones that interest you, and execute the engagement.
          </p>
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <DollarSign size={28} color="var(--accent-green)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Proof & Payout</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Finally, submit your proof of completion. Our automated systems and manual reviewers quickly verify the engagement. Once verified, the funds are credited to your CreateForEarn balance, which you can easily withdraw using your preferred payment method.
          </p>
        </div>
      </div>

    </div>
  );
}
