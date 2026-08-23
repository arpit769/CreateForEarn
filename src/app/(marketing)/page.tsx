import Link from 'next/link';
import { DotGlobeHero } from '@/app/(marketing)/_components/GlobeLazy';
import InteractiveSimulator from '@/app/(marketing)/_components/InteractiveSimulator';
import { ArrowRight, Wallet, Smartphone, Bitcoin, DollarSign, PlaySquare } from 'lucide-react';

const features = [
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Verified Access Only',
    description: 'Only high-quality, aged Reddit accounts and genuine YouTube channels can join. We ensure premium engagement through strict manual verification and continuous monitoring.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Multi-Platform Tasks',
    description: 'Earn from both Reddit and YouTube tasks. Get matched with subreddits that fit your interests or complete YouTube engagement tasks like likes, comments, and subscribes.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Transparent Earnings',
    description: 'Track your pending, available, and paid balances in real-time. One unified wallet across Reddit and YouTube tasks — no hidden fees, no complicated point systems.',
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
    description: 'Choose between admin-provided templates or craft your own original content. High-quality posts and interactions receive bonuses and priority approvals.',
  },
  {
    icon: '',
    iconBg: 'var(--feature-icon-bg)',
    title: 'Performance Analytics',
    description: 'Monitor your approval rates, earnings per task, and overall success metrics through our detailed worker dashboard across all platforms.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing-root" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

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

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', textAlign: 'center', width: '100%', maxWidth: '1024px', margin: '0 auto', height: '100%', padding: '40px 16px 20px', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {/* Platform badges */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 69, 0, 0.12)', border: '1px solid rgba(255, 69, 0, 0.25)', color: '#FF4500', padding: '5px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="10"/><path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-1 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.58zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.27.27 0 0 1 .38-.38 3.13 3.13 0 0 0 2.47.67 3.13 3.13 0 0 0 2.47-.67.27.27 0 0 1 .38.38zm-.19-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>
                  Reddit Tasks
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 0, 0, 0.12)', border: '1px solid rgba(255, 0, 0, 0.25)', color: '#FF0000', padding: '5px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                  <PlaySquare size={14} />
                  YouTube Tasks
                </span>
              </div>

              <h1
                className="text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9] select-none"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                <span className="block font-light text-foreground/70 mb-2 text-5xl sm:text-6xl md:text-6xl lg:text-7xl" style={{ color: 'var(--text-primary)' }}>
                  Social Media Workforce
                </span>
                <span className="inline-block relative">
                  <span className="gradient-text-animated" style={{ position: 'relative', zIndex: 10, fontSize: 'inherit' }}>
                    Management Platform
                  </span>
                  <div className="gradient-text-animated"
                    style={{ position: 'absolute', inset: 0, fontFamily: 'Inter, system-ui, sans-serif', filter: 'blur(24px)', opacity: 0.5, transform: 'scale(1.05)' }}>
                    Management Platform
                  </div>
                  <div style={{ position: 'absolute', bottom: 'clamp(-14px, -2vw, -24px)', left: 0, width: '100%', height: 'clamp(6px, 1.2vw, 12px)', background: 'var(--hero-line)', borderRadius: '9999px', boxShadow: '0 10px 15px -3px var(--hero-line-shadow)' }} />
                </span>
              </h1>
            </div>

            <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <p className="text-xl sm:text-2xl md:text-2xl leading-relaxed font-medium"
                style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-secondary)' }}>
                Register, get verified, and receive access to Reddit &amp; YouTube tasks.{" "}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, background: 'linear-gradient(to right, var(--hero-glow-4), var(--hero-glow-3))', padding: '4px 8px', borderRadius: '6px' }}>
                  Submit completed work, earn money,
                </span>
                {" "}and request withdrawals.
              </p>
            </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', paddingTop: '8px', flexWrap: 'wrap' }}>
            <Link
              href="/signup"
              className="btn-primary-lg"
              style={{ padding: '14px 28px', fontSize: '16px', textDecoration: 'none', display: 'inline-flex', gap: '10px', alignItems: 'center' }}
            >
              Start earning
              <ArrowRight style={{ width: '18px', height: '18px' }} />
            </Link>

            <Link
              href="#how-it-works"
              className="btn-secondary-lg"
              style={{ padding: '14px 28px', fontSize: '16px', textDecoration: 'none', display: 'inline-flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}
            >
              How it works
            </Link>
          </div>
        </div>
      </DotGlobeHero>



      {/* ====== 2. PLATFORM STATS ====== */}
      <section className="landing-section" style={{ background: 'var(--hero-glow-1)', padding: 'clamp(56px, 8vw, 120px) 20px', borderTop: '1px solid var(--hero-badge-border)', borderBottom: '1px solid var(--hero-badge-border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>Two platforms. <span className="gradient-text-animated">One wallet. Real money.</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto clamp(32px, 6vw, 64px)' }}>
            Earn across Reddit and YouTube with a single unified account. Complete tasks, get reviewed, and withdraw your earnings — all from one dashboard.
          </p>

          {/* Platform Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div className="feature-card" style={{ padding: 'clamp(24px, 5vw, 36px)', borderRadius: '24px', textAlign: 'left', borderLeft: '3px solid #FF4500' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,69,0,0.1)', padding: '8px', borderRadius: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#FF4500"><circle cx="10" cy="10" r="10"/><path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-1 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.58zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.27.27 0 0 1 .38-.38 3.13 3.13 0 0 0 2.47.67 3.13 3.13 0 0 0 2.47-.67.27.27 0 0 1 .38.38zm-.19-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#FF4500' }}>Reddit Tasks</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Upvote', 'Comment', 'Post', 'Crosspost'].map(t => (
                  <span key={t} style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.2)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Requires min 50 Karma &amp; 20 days account age</p>
            </div>

            <div className="feature-card" style={{ padding: 'clamp(24px, 5vw, 36px)', borderRadius: '24px', textAlign: 'left', borderLeft: '3px solid #FF0000' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '10px' }}>
                  <PlaySquare size={20} color="#FF0000" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#FF0000' }}>YouTube Tasks</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Like', 'Comment', 'Subscribe', 'Post'].map(t => (
                  <span key={t} style={{ background: 'rgba(255,0,0,0.1)', color: '#FF0000', border: '1px solid rgba(255,0,0,0.2)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Just verify your channel name or add your username</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
            {[
              { label: 'Quick Tasks', value: 'upto $5.00', text: 'Earn easily by liking, commenting or replying. Perfect for when you have just a few minutes.' },
              { label: 'Top Pay', value: '$10.00', text: 'Earn top rates for in-depth, high-effort posts across Reddit and YouTube.' },
              { label: 'Direct Payouts', value: '24h', text: 'Cash out directly to your bank. No shady gift cards, low $1 minimum. Reviewed and paid fast.' },
            ].map((stat, i) => (
              <div key={i} className="feature-card" style={{ padding: 'clamp(24px, 5vw, 40px)', borderRadius: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  {stat.value}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{stat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 3. SOLUTION / DASHBOARD PREVIEW ====== */}
      <section className="landing-section simulator-preview-section">
        <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '800px', margin: '0 auto 48px' }}>
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
          width: '100%',
        }}>
          {/* Fake browser chrome */}
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            <div style={{
              flex: 1, margin: '0 12px',
              padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              createforearn.co/tasks
            </div>
          </div>

          <InteractiveSimulator />
        </div>
      </section>

      {/* ====== 3.5. HOW IT WORKS ====== */}
      <section id="how-it-works" className="landing-section" style={{ padding: '80px 24px 160px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            HOW IT WORKS
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Claim. Complete. Prove. Earn.
          </h2>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', title: 'Browse open tasks', desc: 'Tasks list the target platform (Reddit or YouTube), required action, and payout. Filter by type or earnings potential.' },
            { step: '02', title: 'Claim and complete', desc: 'Reserve your slot. Read the brief — it specifies the target subreddit or YouTube video, required action, and any quality guidelines. You have 1 hour to complete and submit.' },
            { step: '03', title: 'Submit your proof', desc: 'Paste the Reddit URL or YouTube link of your completed action. For likes and subscribes, upload a screenshot as proof.' },
            { step: '04', title: 'Get approved, get paid', desc: 'An admin reviews your submission against the brief. Once approved, payout goes straight to your unified wallet.' }
          ].map((item) => (
            <div key={item.step} className="feature-card hover-lift" style={{ background: 'var(--bg-elevated)', borderRadius: '24px', padding: '40px 32px', border: '1px solid var(--border-subtle)', transition: 'transform 0.2s', cursor: 'default' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 800, marginBottom: '32px' }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '15px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 8. INTEGRATIONS ====== */}
      <section className="landing-section" style={{ background: 'var(--hero-glow-1)', padding: '120px 24px', borderTop: '1px solid var(--hero-badge-border)', textAlign: 'center' }}>
        <h2 className="section-title" style={{ marginBottom: '64px', color: 'var(--text-primary)' }}>
          Get paid however you want
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { name: 'UPI', icon: Smartphone, color: '#a855f7' },
            { name: 'USDT(Polygon)', icon: Bitcoin, color: '#2dd4bf' },
            { name: 'Cozy Wallet', icon: Wallet, color: '#3b82f6' },
          ].map((method) => (
            <div
              key={method.name}
              className="feature-card"
              style={{
                width: '160px', height: '160px', borderRadius: '24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', transition: 'transform 0.2s ease'
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'var(--hero-glow-4)',
                color: method.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <method.icon size={32} />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{method.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 9. FAQ ====== */}
      <section className="landing-section" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 className="section-title" style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Common questions, straight answers</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              For more queries: Join our Discord
            </p>
            <a 
              href="https://discord.gg/5qu5s87kKu" 
              target="_blank" 
              rel="noreferrer" 
              className="discord-btn"
              style={{ 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '12px 24px', 
                color: '#ffffff', 
                borderRadius: '10px', 
                fontWeight: 600, 
                fontSize: '15px', 
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(88, 101, 242, 0.25)'
              }}
            >
              <style>{`
                .discord-btn {
                  background-color: #5865F2 !important;
                  transition: background-color 0.2s ease !important;
                }
                .discord-btn:hover {
                  background-color: #4752C4 !important;
                }
              `}</style>
              <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.87-.64,1.71-1.32,2.51-2a75.52,75.52,0,0,0,73,0c.8.7,1.64,1.38,2.51,2a68.43,68.43,0,0,1-10.5,5A77.7,77.7,0,0,0,102,96.36a105.73,105.73,0,0,0,31-18.83C130.1,49.22,124.55,26.41,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.78,46,53.78,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96,46,96,53,91,65.69,84.69,65.69Z"/>
              </svg>
              Join Discord
            </a>
          </div>
          <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { q: 'Who can sign up for CreateForEarn?', a: 'Anyone with a valid Reddit account or YouTube channel can apply. We manually verify all accounts to ensure high-quality engagement and compliance with our standards.' },
              { q: 'What platforms do you support?', a: 'We support both Reddit (upvotes, comments, posts, crossposts) and YouTube (likes, comments, subscribes, posts). You can do tasks on both platforms with a single account.' },
              { q: 'How exactly do I get paid?', a: 'You earn money for every approved task across Reddit and YouTube. Earnings go into one unified wallet. Once ready, withdraw directly via UPI, Crypto, or Cozy Wallet.' },
              { q: 'What kind of content is allowed?', a: 'Non-promotional and organic content only. Direct promotional advertising, spam links, and botting are strictly prohibited. Tasks must add genuine value to the community.' }
            ].map((faq, i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }} className="group">
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)', listStyle: 'none' }}>
                  {faq.q} <span style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>+</span>
                </summary>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '15px' }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 10. CTA AND FOOTER ====== */}
      <section className="landing-section" style={{ padding: '64px 24px', background: 'var(--hero-glow-1)', borderTop: '1px solid var(--hero-badge-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-primary)', borderRadius: '32px', border: '1px solid var(--hero-badge-border)', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 40px 100px var(--glass-shadow)' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '24px', color: 'var(--text-primary)' }}>
            Stop posting for free. <br />
            <span className="gradient-text-animated">Start earning on Reddit &amp; YouTube.</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px' }}>
            You already spend time on Reddit and YouTube. Join CreateForEarn and start getting paid for the content you create and the engagement you give.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn-primary-lg">Start earning now ↗</Link>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Free to join • Reddit &amp; YouTube tasks • Start earning immediately</span>
          </div>
        </div>


      </section>
    </div>
  );
}
