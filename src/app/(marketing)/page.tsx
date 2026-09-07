import Link from 'next/link';
import { ArrowRight, LayoutDashboard, ListTodo, DollarSign, BarChart3, Trophy, MessageSquare, User, Settings, TrendingUp, Eye, CheckCircle2, Plus } from 'lucide-react';

/* ── Static SVG icons for platforms ── */
const RedditIcon = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="#FF4500"><circle cx="10" cy="10" r="10"/><path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-1 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.58zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.86 3.58 3.58 0 0 1-2.85-.86.27.27 0 0 1 .38-.38 3.13 3.13 0 0 0 2.47.67 3.13 3.13 0 0 0 2.47-.67.27.27 0 0 1 .38.38zm-.19-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>
);
const YouTubeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a2.996 2.996 0 0 0-2.112-2.12C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.386.52A2.996 2.996 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.996 2.996 0 0 0 2.112 2.12c1.881.52 9.386.52 9.386.52s7.505 0 9.386-.52a2.996 2.996 0 0 0 2.112-2.12C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const InstagramIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0" y1="24" x2="24" y2="0"><stop offset="0%" stopColor="#F58529"/><stop offset="50%" stopColor="#DD2A7B"/><stop offset="100%" stopColor="#8134AF"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="white"/><rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="1.5" fill="none"/></svg>
);
const XIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const LinkedInIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#0A66C2"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="white" d="M7.5 9.5h-2v8h2v-8zm-1-3.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm10 3.5h-2.2c-1.1 0-1.6.6-1.8.9v-.9h-2v8h2v-4.5c0-1.1.5-1.7 1.4-1.7.8 0 1.1.5 1.1 1.5v4.7h2v-5.3c0-1.8-.8-2.7-2.5-2.7z"/></svg>
);
const FacebookIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z"/></svg>
);
const TikTokIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);

/* ── Dashboard sidebar items for preview ── */
const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: ListTodo, label: 'My Tasks', active: false },
  { icon: DollarSign, label: 'Earnings', active: false },
  { icon: BarChart3, label: 'Performance', active: false },
  { icon: Trophy, label: 'Leaderboard', active: false },
  { icon: MessageSquare, label: 'Messages', active: false },
  { icon: User, label: 'Profile', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

const chartHeights = [30, 45, 35, 55, 40, 65, 50, 75];

export default function HomePage() {
  return (
    <div>
      {/* ════════ HERO ════════ */}
      <section className="mk-hero">
        <div className="mk-hero__inner">
          <div>
            <div className="mk-hero__badges">
              <span className="mk-hero__badge">✓ 100% Original Content</span>
              <span className="mk-hero__badge-dot">•</span>
              <span className="mk-hero__badge">Performance Based</span>
              <span className="mk-hero__badge-dot">•</span>
              <span className="mk-hero__badge">Secure Payments</span>
            </div>

            <h1 className="mk-hero__title">
              Create Content.<br />
              <span className="mk-hero__title-accent">Earn More.</span>
            </h1>

            <p className="mk-hero__desc">
              Join CreateForEarn – the platform where writers and creators complete tasks on multiple platforms and earn based on performance.
            </p>

            <div className="mk-hero__cta">
              <Link href="/signup" className="mk-btn mk-btn--primary mk-btn--lg">
                Start Earning Now <ArrowRight size={18} />
              </Link>
              <Link href="/for-clients" className="mk-btn mk-btn--outline mk-btn--lg">
                I&apos;m a Client
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mk-dashboard-preview">
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Mini Sidebar */}
              <div className="mk-sidebar-preview" style={{ display: 'none' }}>
                <div className="mk-sidebar-preview__logo">
                  <div className="mk-sidebar-preview__logo-icon">
                    <img src="/logo.png" alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                  </div>
                  <span className="mk-sidebar-preview__logo-text">CreateForEarn</span>
                </div>
                <div className="mk-sidebar-preview__nav">
                  {sidebarItems.map(item => (
                    <div key={item.label} className={`mk-sidebar-preview__item ${item.active ? 'mk-sidebar-preview__item--active' : ''}`}>
                      <item.icon size={14} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Dashboard Content */}
              <div style={{ flex: 1 }}>
                <div className="mk-dashboard-preview__header">
                  <span className="mk-dashboard-preview__title">Dashboard Overview</span>
                </div>

                {/* Stats Row */}
                <div className="mk-dash-stats">
                  <div className="mk-dash-stat">
                    <div className="mk-dash-stat__label">Total Earnings</div>
                    <div className="mk-dash-stat__value">$1,245.50</div>
                    <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 18.6%</div>
                  </div>
                  <div className="mk-dash-stat">
                    <div className="mk-dash-stat__label">Tasks Completed</div>
                    <div className="mk-dash-stat__value">48</div>
                    <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 12.4%</div>
                  </div>
                  <div className="mk-dash-stat">
                    <div className="mk-dash-stat__label">Total Views</div>
                    <div className="mk-dash-stat__value">125.6K</div>
                    <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 22.1%</div>
                  </div>
                  <div className="mk-dash-stat">
                    <div className="mk-dash-stat__label">Approved Rate</div>
                    <div className="mk-dash-stat__value">92%</div>
                    <div className="mk-dash-stat__change mk-dash-stat__change--up">↑ 8.7%</div>
                  </div>
                </div>

                {/* Chart Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="mk-dash-chart">
                    <div className="mk-dash-chart__header">
                      <span className="mk-dash-chart__title">Performance Overview</span>
                      <span style={{ fontSize: '10px', color: 'var(--mk-text-muted)' }}>This Month ▾</span>
                    </div>
                    <div className="mk-dash-chart__bars">
                      {chartHeights.map((h, i) => (
                        <div key={i} className="mk-dash-chart__bar" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Cards */}
                <div className="mk-dash-bottom">
                  <div className="mk-dash-bottom-card">
                    <div className="mk-dash-bottom-card__title">Upcoming Tasks</div>
                    <div className="mk-dash-bottom-card__value">2 tasks pending</div>
                    <span className="mk-dash-bottom-card__btn">View Tasks</span>
                  </div>
                  <div className="mk-dash-bottom-card">
                    <div className="mk-dash-bottom-card__title">Recent Activity</div>
                    <div className="mk-dash-bottom-card__value">5 tasks approved</div>
                    <span className="mk-dash-bottom-card__btn">View Activity</span>
                  </div>
                  <div className="mk-dash-bottom-card">
                    <div className="mk-dash-bottom-card__title">Earnings This Month</div>
                    <div className="mk-dash-bottom-card__amount">$342.80</div>
                    <div className="mk-dash-bottom-card__amount-change">↑ 18.6% vs last month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PLATFORMS ════════ */}
      <section className="mk-section mk-section--subtle">
        <div className="mk-container">
          <div className="mk-section__header">
            <h2 className="mk-section__title">Opportunities Across Multiple Platforms</h2>
            <p className="mk-section__subtitle">Choose from a variety of platforms and communities.</p>
          </div>

          <div className="mk-platforms">
            {[
              { name: 'Reddit', desc: 'Communities', icon: <RedditIcon /> },
              { name: 'YouTube', desc: 'Videos, Shorts & Posts', icon: <YouTubeIcon /> },
              { name: 'Instagram', desc: 'Posts, Reels & Stories', icon: <InstagramIcon /> },
              { name: 'X (Twitter)', desc: 'Tweets, Threads & Discussions', icon: <XIcon /> },
              { name: 'LinkedIn', desc: 'Articles & Posts', icon: <LinkedInIcon /> },
              { name: 'Facebook', desc: 'Groups & Posts', icon: <FacebookIcon /> },
              { name: 'TikTok', desc: 'Videos & Shorts', icon: <TikTokIcon /> },
              { name: 'More Platforms', desc: 'Coming Soon', icon: <Plus size={28} color="var(--mk-primary)" /> },
            ].map(platform => (
              <div key={platform.name} className="mk-platform-card">
                <div className="mk-platform-card__icon">{platform.icon}</div>
                <div className="mk-platform-card__name">{platform.name}</div>
                <div className="mk-platform-card__desc">{platform.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
