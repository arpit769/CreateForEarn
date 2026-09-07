'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, HelpCircle, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ClientComingSoonPage() {
  return (
    <div className="mk-mesh-container" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
      {/* Blueprint Grid Background Pattern */}
      <div className="mk-grid-bg" />

      <div className="mk-container" style={{ position: 'relative', zIndex: 1, padding: '40px 24px', width: '100%' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back link */}
            <div style={{ marginBottom: '24px' }}>
              <Link 
                href="/for-clients" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: 'var(--mk-text-muted)', 
                  fontSize: '13px', 
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft size={16} /> Back to For Clients
              </Link>
            </div>

            {/* Pill */}
            <div className="mk-live-pill" style={{ margin: '0 auto 20px' }}>
              <span className="mk-live-dot" />
              <span>Brand &amp; Agency Portal</span>
            </div>

            {/* Title */}
            <h1 className="mk-section__title" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '16px' }}>
              Client Platform <span className="mk-gradient-text">Coming Soon</span>
            </h1>

            <p className="mk-section__subtitle" style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
              We are currently fine-tuning our automated campaign distribution and creator matching infrastructure. Self-serve brand campaign management will be live soon!
            </p>

            {/* Architectural Info Bento Card */}
            <div className="mk-bento-card mk-tech-card" style={{ padding: '32px', textAlign: 'left', marginBottom: '32px' }}>
              <span className="mk-corner-plus mk-corner-plus--tl">+</span>
              <span className="mk-corner-plus mk-corner-plus--tr">+</span>
              <span className="mk-corner-plus mk-corner-plus--bl">+</span>
              <span className="mk-corner-plus mk-corner-plus--br">+</span>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--mk-text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#6366f1" /> What to expect on launch:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--mk-text-secondary)' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Instant targeted campaign deployment
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--mk-text-secondary)' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Automated proof verification telemetry
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--mk-text-secondary)' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Direct escrow budget controls
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--mk-text-secondary)' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Top 5% verified creator assignment
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '13px', color: 'var(--mk-text)', lineHeight: 1.5 }}>
                <strong>Need custom campaign setup or early access?</strong> Our dedicated team is available to assist and set up your campaigns manually today.
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link 
                  href="/help" 
                  className="mk-btn mk-btn--primary mk-btn--lg" 
                  style={{ 
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <HelpCircle size={18} /> Visit Help &amp; Support Page <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link 
                  href="/signup" 
                  className="mk-btn mk-btn--outline mk-btn--lg"
                >
                  Join as Creator / Writer
                </Link>
              </motion.div>
            </div>

          </motion.div>

        </div>
      </div>
    </div>
  );
}
