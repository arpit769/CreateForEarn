import Link from 'next/link';
import { DotGlobeHero } from '@/app/(marketing)/_components/GlobeLazy';
import InteractiveSimulator from '@/app/(marketing)/_components/InteractiveSimulator';
import { ArrowRight, Zap, CreditCard, Landmark, Wallet, Smartphone, Bitcoin, DollarSign } from 'lucide-react';

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <h1
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
                  {/* CSS underline drawn via animation — no JS needed */}
                  <div style={{ position: 'absolute', bottom: '-24px', left: 0, width: '100%', height: '12px', background: 'var(--hero-line)', borderRadius: '9999px', boxShadow: '0 10px 15px -3px var(--hero-line-shadow)' }} />
                </span>
              </h1>
            </div>

            <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <p className="text-xl md:text-2xl leading-relaxed font-medium"
                style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-secondary)' }}>
                Register, get verified, and receive access to assigned subreddit tasks.{" "}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, background: 'linear-gradient(to right, var(--hero-glow-4), var(--hero-glow-3))', padding: '4px 8px', borderRadius: '6px' }}>
                  Submit completed work, earn money,
                </span>
                {" "}and request withdrawals.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center', paddingTop: '16px', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <button
                className="btn-primary-lg"
                style={{ padding: '16px 32px', fontSize: '18px', display: 'flex', gap: '12px', alignItems: 'center', border: 'none', cursor: 'pointer' }}
              >
                Start earning
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </button>
            </Link>

            <a href="#how-it-works" style={{ textDecoration: 'none' }}>
              <button
                className="btn-secondary-lg"
                style={{ padding: '16px 32px', fontSize: '18px', display: 'flex', gap: '12px', alignItems: 'center', border: 'none', cursor: 'pointer', background: 'transparent' }}
              >
                <Zap style={{ width: '20px', height: '20px', color: 'var(--accent-purple)' }} />
                How it works
              </button>
            </a>
          </div>
        </div>
      </DotGlobeHero>



      {/* ====== 2. PROBLEM STATEMENT ====== */}
      <section className="landing-section" style={{ background: 'var(--hero-glow-1)', padding: '120px 24px', borderTop: '1px solid var(--hero-badge-border)', borderBottom: '1px solid var(--hero-badge-border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>Growing communities is hard. <span className="gradient-text-animated">Getting paid shouldn't be.</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto 64px' }}>
            Brands need real, authentic engagement to kickstart their subreddits. You already spend hours on Reddit, now you can get paid for the insightful comments you already write.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
              { label: 'Quick Tasks', value: 'upto $5.00', text: 'Earn easily by replying to threads or crossposting. Perfect for when you have just a few minutes.' },
              { label: 'Top Pay', value: '$10.00', text: 'Teams spend around $10.00 of their time on repetitive handoffs and moving between tools.' },
              { label: 'Direct Payouts', value: '24h', text: 'Cash out directly to your bank account. No shady gift cards, low $3 minimum. Reviewed and paid fast.' },
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
            Claim. Post. Prove. Earn.
          </h2>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', title: 'Browse open tasks', desc: 'Tasks list the target subreddit, required action, and payout. Filter by type or earnings potential.' },
            { step: '02', title: 'Claim and complete', desc: 'Reserve your slot. Read the brief — it specifies the target subreddit, required action, and any quality guidelines. You have 30 minutes to complete and submit.' },
            { step: '03', title: 'Submit your proof', desc: 'Paste the Reddit URL of your completed action. No upload or complex form required.' },
            { step: '04', title: 'Get approved, get paid', desc: 'An admin reviews your submission against the brief. Once approved, payout goes straight to your bank.' }
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
            { name: 'Crypto', icon: Bitcoin, color: '#2dd4bf' },
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
              { q: 'Who can sign up for CreateForEarn?', a: 'Anyone with a valid, aged Reddit account can apply. We manually verify all accounts to ensure high-quality engagement and compliance with our standards.' },
              { q: 'How exactly do I get paid?', a: 'You earn money for every approved task. Once your balance is ready, you can withdraw directly via UPI, Crypto, or Cozy Wallet.' },
              { q: 'What kind of posts are allowed?', a: 'Non-promotional and organic content only. Direct promotional advertising, spam links, and botting are strictly prohibited. Tasks must add genuine discussion value to the community.' }
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
