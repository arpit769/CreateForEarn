'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { DotGlobeHero } from '@/components/ui/globe-hero';
import { ArrowRight, Zap, CreditCard, Landmark, Wallet, Smartphone, Bitcoin, DollarSign, Hash } from 'lucide-react';

const features = [
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Verified Access Only',
    description: 'Only high-quality, aged Reddit accounts can join. We ensure premium engagement through strict manual verification and continuous monitoring.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Smart Task Routing',
    description: 'Get matched with subreddits that fit your interests and expertise. Our tagging system ensures you only see tasks you are qualified for.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Transparent Earnings',
    description: 'Track your pending, available, and paid balances in real-time. No hidden fees, no complicated point systems — just straight cash.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Fast Payouts',
    description: 'Withdraw your earnings directly via UPI or Crypto (USDT). Fast approval cycles mean you get paid for your hard work within 24 hours.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Quality Content First',
    description: 'Choose between admin-provided templates or craft your own original content. High-quality posts receive bonuses and priority approvals.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Performance Analytics',
    description: 'Monitor your approval rates, earnings per subreddit, and overall success metrics through our detailed worker dashboard.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Register & Get Verified',
    description: 'Sign up with your Reddit account. Our team will verify your account age and karma to ensure you meet our quality standards.',
    color: 'var(--text-primary)',
  },
  {
    number: '02',
    title: 'Claim Paid Tasks',
    description: 'Browse tasks available for your assigned subreddit tags. Claim posts or comments that match your interests.',
    color: 'var(--text-secondary)',
  },
  {
    number: '03',
    title: 'Submit & Earn',
    description: 'Complete the work on Reddit, submit your link for review, and watch your wallet balance grow.',
    color: 'var(--text-muted)',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Mod of r/webdev (2.1M members)',
    avatar: 'SC',
    avatarBg: 'var(--border-medium)',
    text: 'CreateForEarn has completely changed how our team earns. The bulk actions and tasks are a game-changer.',
    stars: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Mod of r/datascience (1.4M members)',
    avatar: 'MJ',
    avatarBg: 'var(--border-subtle)',
    text: 'The analytics dashboard finally gives us the insights we need. We can see exactly when to post and what our community loves.',
    stars: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Mod of r/gamedev (850K members)',
    avatar: 'PP',
    avatarBg: 'var(--bg-elevated)',
    text: 'Beautiful interface, incredibly fast, and the scheduled posts feature keeps our weekly threads running like clockwork. Love it!',
    stars: 5,
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>


      {/* ====== GLOBE HERO ====== */}
      <DotGlobeHero
        rotationSpeed={0.004}
        style={{
          background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-primary), var(--bg-secondary))'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--hero-overlay-start), transparent, var(--hero-overlay-end))' }} />
        <div style={{ position: 'absolute', top: '25%', left: '25%', width: '24rem', height: '24rem', background: 'var(--hero-glow-1)', borderRadius: '50%', filter: 'blur(64px)' }} className="animate-pulse" />
        <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '16rem', height: '16rem', background: 'var(--hero-glow-2)', borderRadius: '50%', filter: 'blur(64px)' }} className="animate-pulse" />
        
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%', maxWidth: '1024px', margin: '0 auto', padding: '0px 24px 48px', gap: '48px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderRadius: '9999px',
                background: 'linear-gradient(to right, var(--hero-glow-4), var(--hero-glow-1), var(--hero-glow-4))',
                border: '1px solid var(--hero-badge-border)', backdropFilter: 'blur(24px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, borderRadius: '9999px', background: 'linear-gradient(to right, var(--hero-glow-3), transparent, var(--hero-glow-3))' }} className="animate-pulse" />
              <div style={{ width: '8px', height: '8px', background: 'var(--text-primary)', borderRadius: '50%' }} className="animate-ping" />
              <span style={{ position: 'relative', zIndex: 10, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>NOW IN PUBLIC BETA</span>
              <div style={{ width: '8px', height: '8px', background: 'var(--text-primary)', borderRadius: '50%', animationDelay: '500ms' }} className="animate-ping" />
            </motion.div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.85] select-none"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                <span className="block font-light text-foreground/70 mb-3 text-4xl md:text-6xl lg:text-7xl" style={{ color: 'var(--text-primary)' }}>
                  Reddit Workforce
                </span>
                <span className="inline-block relative">
                  <span className="gradient-text-animated" style={{ position: 'relative', zIndex: 10, fontSize: 'inherit' }}>
                    Management Platform
                  </span>
                  <div className="gradient-text-animated" 
                       style={{ position: 'absolute', inset: 0, fontFamily: 'Inter, system-ui, sans-serif', filter: 'blur(24px)', opacity: 0.5, transform: 'scale(1.05)' }}>
                    Management Platform
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                    style={{ position: 'absolute', bottom: '-24px', left: 0, height: '12px', background: 'var(--hero-line)', borderRadius: '9999px', boxShadow: '0 10px 15px -3px var(--hero-line-shadow)' }}
                  />
                </span>
              </motion.h1>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}
            >
              <p className="text-xl md:text-2xl leading-relaxed font-medium" 
                 style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-secondary)' }}>
                Register, get verified, and receive access to assigned subreddit tasks.{" "}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, background: 'linear-gradient(to right, var(--hero-glow-4), var(--hero-glow-3))', padding: '4px 8px', borderRadius: '6px' }}>
                  Submit completed work, earn money,
                </span>
                {" "}and request withdrawals.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center', paddingTop: '16px', flexWrap: 'wrap' }}
          >
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary-lg"
                style={{ padding: '16px 32px', fontSize: '18px', display: 'flex', gap: '12px', alignItems: 'center', border: 'none', cursor: 'pointer' }}
              >
                Start earning
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </motion.button>
            </Link>
            
            <a href="#features" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary-lg"
                style={{ padding: '16px 32px', fontSize: '18px', display: 'flex', gap: '12px', alignItems: 'center', border: 'none', cursor: 'pointer', background: 'transparent' }}
              >
                <Zap style={{ width: '20px', height: '20px', color: 'var(--accent-purple)' }} />
                How it works
              </motion.button>
            </a>
          </motion.div>
        </div>
      </DotGlobeHero>



      {/* ====== 2. PROBLEM STATEMENT ====== */}
      <section className="landing-section" style={{ background: 'var(--hero-glow-1)', padding: '120px 24px', borderTop: '1px solid var(--hero-badge-border)', borderBottom: '1px solid var(--hero-badge-border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>Growing communities is hard. <span className="gradient-text-animated">Getting paid shouldn't be.</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto 64px' }}>
            Brands need real, authentic engagement to kickstart their subreddits. You already spend hours on Reddit — now you can get paid for the insightful comments you already write.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
              { label: 'Quick Tasks', value: '$0.50+', text: 'Earn easily by replying to threads or crossposting. Perfect for when you have just a few minutes.' },
              { label: 'Top Pay', value: '$10.00', text: 'Teams spend around $10.00 of their time on repetitive handoffs and moving between tools.' },
              { label: 'Direct Payouts', value: '24h', text: 'Cash out directly to your bank account. No shady gift cards, no minimums. Reviewed and paid fast.' },
            ].map((stat, i) => (
              <div key={i} className="feature-card" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '64px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  {stat.value}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{stat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 3. SOLUTION / DASHBOARD PREVIEW ====== */}
      <section className="landing-section" style={{ padding: '160px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>
            Browse a massive marketplace of paid tasks. Find communities you actually care about.
          </h2>
        </div>

        <div style={{
          position: 'relative',
          borderRadius: '24px',
          border: '1px solid var(--hero-badge-border)',
          overflow: 'hidden',
          boxShadow: '0 40px 100px var(--glass-shadow), 0 0 80px var(--hero-glow-4)',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Fake browser chrome */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-secondary)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-primary)' }} />
            </div>
            <div style={{
              flex: 1, margin: '0 60px',
              padding: '6px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center',
            }}>
              createforearn.co/tasks
            </div>
          </div>

          <div style={{
            padding: '24px',
            background: 'var(--bg-primary)',
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '16px',
            minHeight: '400px',
          }}>
            {/* Mock sidebar */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '16px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '6px 8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--text-primary)', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}></div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>CreateForEarn</span>
              </div>
              {['Dashboard', 'Available Tasks', 'My Submissions', 'Earnings', 'Payouts', 'Settings'].map((item, i) => (
                <div key={item} style={{
                  padding: '8px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                  color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: i === 0 ? 'var(--hero-glow-4)' : 'transparent',
                  marginBottom: '2px',
                }}>
                  {item}
                </div>
              ))}
            </div>

            {/* Mock main content */}
            <div>
              {/* Mock stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Total Earned', value: '$482.50', color: 'var(--text-primary)' },
                  { label: 'Pending', value: '$24.00', color: 'var(--text-primary)' },
                  { label: 'Tasks Done', value: '38', color: 'var(--text-primary)' },
                  { label: 'Available Tasks', value: '124', color: 'var(--text-primary)' },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Mock chart area */}
              <div style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                height: '200px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Earnings Overview</div>
                <svg width="100%" height="140" viewBox="0 0 600 140" preserveAspectRatio="none" style={{ opacity: 0.6 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 120 Q50 100 100 90 T200 70 T300 50 T400 60 T500 40 T600 30 V140 H0 Z" fill="url(#chartGrad)" />
                  <path d="M0 120 Q50 100 100 90 T200 70 T300 50 T400 60 T500 40 T600 30" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== 3.5. HOW IT WORKS ====== */}
      <section className="landing-section" style={{ padding: '80px 24px 160px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            HOW IT WORKS
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Claim. Post. Prove. Earn.
          </h2>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', title: 'Browse open tasks', desc: 'Tasks list the target subreddit, required action, and payout. Filter by type or earnings potential.' },
            { step: '02', title: 'Claim and complete', desc: 'Reserve your slot. Read the brief — it specifies the target subreddit, required action, and any quality guidelines. You have 24 hours to complete and submit.' },
            { step: '03', title: 'Submit your proof', desc: 'Paste the Reddit URL of your completed action. No upload or complex form required.' },
            { step: '04', title: 'Get approved, get paid', desc: 'An admin reviews your submission against the brief. Once approved, payout goes straight to your bank.' }
          ].map((item) => (
            <div key={item.step} className="feature-card" style={{ background: 'var(--bg-elevated)', borderRadius: '24px', padding: '40px 32px', border: '1px solid var(--border-subtle)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 800, marginBottom: '32px' }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '15px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 4. BENTO BOX FEATURES ====== */}
      <section className="landing-section" style={{ background: 'var(--hero-glow-1)', padding: '120px 24px', borderTop: '1px solid var(--hero-badge-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ maxWidth: '600px', marginBottom: '64px', color: 'var(--text-primary)' }}>
            Turn your Reddit time into <span className="gradient-text-animated">real earnings.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="feature-card" style={{ padding: '40px', borderRadius: '24px' }}>

              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Browse Tasks</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Scroll through our marketplace of community-building tasks. Filter by your favorite topics, from tech to gaming to coffee.</p>
            </div>
            <div className="feature-card" style={{ padding: '40px', borderRadius: '24px' }}>

              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Submit Proof</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Once you've made your post or comment, simply paste the Reddit URL into our dashboard. Our team reviews submissions within 24 hours.</p>
            </div>
            <div className="feature-card" style={{ padding: '40px', borderRadius: '24px', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Earn & Cash Out</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6, maxWidth: '600px' }}>Watch your balance grow and withdraw straight to your bank account when you're ready.</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ color: 'var(--text-primary)' }}></div><span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No minimum withdrawal limits</span></li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ color: 'var(--text-primary)' }}></div><span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Direct Stripe payouts to your bank</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>



      {/* ====== 6. TABBED FEATURE DEEP DIVE ====== */}
      <section className="landing-section" style={{ background: 'var(--hero-glow-1)', padding: '120px 24px', borderTop: '1px solid var(--hero-badge-border)', borderBottom: '1px solid var(--hero-badge-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ maxWidth: '600px', marginBottom: '80px', color: 'var(--text-primary)' }}>
            How to maximize your earnings on <span className="gradient-text-animated">CreateForEarn</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Find high-paying niches', 'Write authentic content', 'Track your payouts'].map((tab, i) => (
              <div 
                key={tab} 
                className="feature-card"
                style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
              >
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>{tab}</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {i === 0 && "Sort by 'Top Pay' to find subreddits that reward detailed, original posts."}
                  {i === 1 && "Create genuine posts without AI filler. Better content gets approved faster and pays more."}
                  {i === 2 && "Monitor your pending and available balances. Cash out to your bank instantly."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 7. REAL OPERATIONAL OUTCOMES ====== */}
      <section className="landing-section" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ maxWidth: '600px', marginBottom: '64px', color: 'var(--text-primary)' }}>
            The easiest way to monetize your Reddit time
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {[
              { metric: '$2.4M+', label: 'Paid out to users' },
              { metric: '500+', label: 'Active tasks daily' },
              { metric: '< 24h', label: 'Average review time' },
            ].map((stat, i) => (
              <div key={i} className="feature-card" style={{ padding: '40px', borderRadius: '24px', height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-elevated)' }} />
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <div style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '8px', color: 'var(--text-primary)' }}>{stat.metric}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 8. INTEGRATIONS ====== */}
      <section className="landing-section" style={{ background: 'var(--hero-glow-1)', padding: '120px 24px', borderTop: '1px solid var(--hero-badge-border)', textAlign: 'center' }}>
        <h2 className="section-title" style={{ marginBottom: '64px', color: 'var(--text-primary)' }}>
          Get paid however you want
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { name: 'Bank Transfer', icon: Landmark, color: '#4ade80' },
            { name: 'Stripe', icon: CreditCard, color: '#6366f1' },
            { name: 'PayPal', icon: DollarSign, color: '#3b82f6' },
            { name: 'Crypto (USDT)', icon: Wallet, color: '#2dd4bf' },
            { name: 'Bitcoin', icon: Bitcoin, color: '#f59e0b' },
            { name: 'UPI', icon: Smartphone, color: '#a855f7' },
          ].map((method, i) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="feature-card"
              style={{
                width: '160px', height: '160px', borderRadius: '24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: `var(--hero-glow-4)`,
                color: method.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <method.icon size={32} />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{method.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== 9. FAQ ====== */}
      <section className="landing-section" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>Common questions, straight answers</h2>
            <button className="btn-secondary" style={{ marginTop: '24px' }}>Contact us</button>
          </div>
          <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Who can sign up for CreateForEarn?', 'How exactly do I get paid?', 'What kind of posts are allowed?'].map((q, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  {q} <span style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>+</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 10. CTA AND FOOTER ====== */}
      <section className="landing-section" style={{ padding: '64px 24px', background: 'var(--hero-glow-1)', borderTop: '1px solid var(--hero-badge-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-primary)', borderRadius: '32px', border: '1px solid var(--hero-badge-border)', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 40px 100px var(--glass-shadow)' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '24px', color: 'var(--text-primary)' }}>
            Stop posting for free. <br />
            <span className="gradient-text-animated">More actual progress.</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px' }}>
            You already spend time discussing your favorite topics on Reddit. Join CreateForEarn and start getting paid for it.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn-primary-lg">Start earning now ↗</Link>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Free to join • Start earning immediately</span>
          </div>
        </div>


      </section>
    </div>
  );
}
