'use client';

import { ShieldCheck, TrendingUp, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturesPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px', textAlign: 'justify', color: 'var(--text-secondary)' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '48px' }}>
        Core Features
      </h1>
      
      <p style={{ fontSize: '18px', lineHeight: 1.8, marginBottom: '64px' }}>
        At CreateForEarn, we pride ourselves on delivering a comprehensive suite of features designed to enhance your community-building experience on Reddit. 
        Our platform is built with both efficiency and security in mind, ensuring that every interaction you have is meaningful, safe, and most importantly, rewarding.
        Whether you are a seasoned earner or just starting, our toolset is tailored to give you the best possible advantage in scaling your engagement.
      </p>

      {/* Feature Diagram */}
      <div style={{ background: 'var(--hero-glow-1)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '64px 32px', marginBottom: '64px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '48px' }}>The CreateForEarn Ecosystem</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '200px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={32} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Secure Verification</h3>
            <p style={{ fontSize: '13px', textAlign: 'center' }}>Only high-quality accounts are admitted.</p>
          </div>

          <div style={{ color: 'var(--text-muted)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '200px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={32} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Smart Routing</h3>
            <p style={{ fontSize: '13px', textAlign: 'center' }}>Match with the perfect subreddits.</p>
          </div>

          <div style={{ color: 'var(--text-muted)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '200px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={32} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Earn Rewards</h3>
            <p style={{ fontSize: '13px', textAlign: 'center' }}>Complete tasks and accumulate earnings.</p>
          </div>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <ShieldCheck size={28} color="var(--accent-cyan)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Verified Protocol</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Our verified access protocol guarantees that the ecosystem remains clean. By restricting entry to high-quality, aged Reddit accounts, we eliminate spam and ensure that all engagement is authentic. This strict manual verification process is continuously monitored to uphold the integrity of the communities we serve.
          </p>
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <TrendingUp size={28} color="var(--accent-green)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Smart Routing</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Once inside, our smart task routing takes over. You are automatically matched with subreddits and tasks that align with your specific interests and expertise. Our intelligent tagging system means you never have to sift through irrelevant tasks; this targeted approach saves you time and increases your approval rates.
          </p>
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <Coins size={28} color="var(--accent-orange)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Transparent Earnings</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Our transparent earnings system ensures you always know exactly where you stand. Track your pending, available, and paid balances in real-time. When it's time to cash out, our fast payouts process via UPI or Crypto ensures you receive your hard-earned money quickly, often within 24 hours.
          </p>
        </div>
      </div>

    </div>
  );
}
