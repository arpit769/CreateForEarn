'use client';

import { Info, Users, Shield, Target, Compass, Scale, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px', textAlign: 'justify', color: 'var(--text-secondary)' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '48px' }}>
        About CreateForEarn
      </h1>
      
      <p style={{ fontSize: '18px', lineHeight: 1.8, marginBottom: '64px' }}>
        CreateForEarn was founded with a singular vision: to empower Reddit users by providing them with a legitimate, transparent, and rewarding platform to monetize their community engagement. We understand that vibrant online communities thrive on authentic interaction, and we believe the individuals providing that interaction should be fairly compensated for their time and expertise.
      </p>

      {/* About Highlights */}
      <div style={{ background: 'var(--hero-glow-1)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '64px 32px', marginBottom: '64px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '48px' }}>Our Core Pillars</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={28} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Community First</h3>
            <p style={{ fontSize: '13px' }}>We prioritize the health and integrity of Reddit communities above all else.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={28} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Strict Quality Control</h3>
            <p style={{ fontSize: '13px' }}>Rigorous standards ensure only authentic engagement takes place.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={28} color="var(--text-primary)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Empowered Creators</h3>
            <p style={{ fontSize: '13px' }}>Giving power back to the users who make the platform valuable.</p>
          </div>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <Compass size={28} color="var(--accent-cyan)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Our Vision</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            The landscape of digital community building has changed dramatically. CreateForEarn seeks to democratize value creation. By bridging the gap between community managers who need robust engagement and the users who provide it, we have created an ecosystem where everyone wins.
          </p>
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <Scale size={28} color="var(--accent-purple)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Ethical Approach</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Our team is comprised of seasoned Reddit moderators and engineers. We have built CreateForEarn to respect the culture of Reddit. This means no spam, no low-effort botting, and no deceptive practices. We enforce strict quality control measures to ensure we are a force for good.
          </p>
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '24px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <Zap size={28} color="var(--accent-orange)" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>Future Roadmap</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Looking to the future, CreateForEarn aims to expand its toolset to offer even more ways for users to connect, engage, and earn. We are constantly listening to our user base, refining our matching algorithms, and streamlining our payout processes for maximum efficiency.
          </p>
        </div>
      </div>

    </div>
  );
}
