'use client';

import React from 'react';
import { Megaphone, FileText, Eye, Wallet, Plus, Users, ClipboardList, CreditCard, ChevronDown, Calendar, ArrowUpRight, ArrowRight, PlaySquare } from 'lucide-react';

export default function ClientDashboard() {
  return (
    <div style={{ padding: '8px 0 32px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Welcome back, Brand Connect! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Here's what's happening with your campaigns.
          </p>
        </div>
        
        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px', 
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
          padding: '8px 16px', borderRadius: '8px', fontSize: '13px', 
          fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer'
        }}>
          <Calendar size={14} color="var(--text-muted)" />
          May 12 – May 18, 2026
          <ChevronDown size={14} color="var(--text-muted)" />
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Active Campaigns */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Megaphone size={20} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Campaigns</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>8</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
            2 ending soon
          </div>
        </div>

        {/* Total Submissions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <FileText size={20} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Submissions</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>156</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
            <ArrowUpRight size={14} />
            +23 this week
          </div>
        </div>

        {/* Total Views */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Eye size={20} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Views</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>248.5K</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
            <ArrowUpRight size={14} />
            +18.6% this week
          </div>
        </div>

        {/* Total Spent */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
              <Wallet size={20} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Spent</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>$2,450.00</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
            <ArrowUpRight size={14} />
            +12.4% this week
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Campaigns Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Active Campaigns</h2>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View All</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Campaign</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Platform</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Submissions</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Views</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'New Gadget Review', desc: 'Tech Accessories', platform: 'TikTok', subs: 28, views: '45.2K', status: 'Active', color: '#10b981' },
                  { name: 'Productivity Tips Thread', desc: 'App/Software', platform: 'Reddit', subs: 42, views: '87.1K', status: 'Active', color: '#10b981' },
                  { name: 'Study Motivation Video', desc: 'EdTech', platform: 'YouTube', subs: 15, views: '32.6K', status: 'Active', color: '#10b981' },
                  { name: 'AI Tools Discussion', desc: 'Tech Startup', platform: 'Reddit', subs: 31, views: '56.3K', status: 'Active', color: '#10b981' },
                  { name: 'Daily Routine Post', desc: 'Lifestyle', platform: 'Instagram', subs: 18, views: '27.3K', status: 'Ending Soon', color: '#f59e0b' }
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i === 4 ? 'none' : '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <PlaySquare size={16} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.desc}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.platform}</td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{row.subs}</td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{row.views}</td>
                    <td style={{ padding: '16px 0' }}>
                      <span style={{ 
                        fontSize: '12px', fontWeight: 600, color: row.color, 
                        background: `${row.color}15`, padding: '4px 10px', borderRadius: '20px' 
                      }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-elevated)', color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              View All Campaigns
            </button>
          </div>

          {/* Recent Submissions Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Submissions</h2>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View All</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Writer</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Campaign</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Submitted</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Quality</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Views</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Aman Verma', platform: 'TikTok', camp: 'New Gadget Review', date: 'May 18, 2026', time: '2 hours ago', score: 92, views: '12.5K' },
                  { name: 'Neha Singh', platform: 'Reddit', camp: 'Productivity Tips Thread', date: 'May 18, 2026', time: '5 hours ago', score: 88, views: '8.2K' },
                  { name: 'Rahul Das', platform: 'YouTube', camp: 'Study Motivation Video', date: 'May 17, 2026', time: '1 day ago', score: 95, views: '15.7K' }
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i === 2 ? 'none' : '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                          {row.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.platform}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.camp}</td>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.time}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.date}</div>
                    </td>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{row.score}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{row.views}</td>
                    <td style={{ padding: '16px 0' }}>
                      <button style={{ padding: '6px 14px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Actions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              
              <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.1)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: '12px', boxShadow: '0 2px 8px rgba(124,58,237,0.1)' }}>
                  <Plus size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Create Campaign</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Launch a new campaign</div>
              </button>

              <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <Users size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Browse Writers</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Find the right writers</div>
              </button>

              <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <ClipboardList size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>View Submissions</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Review writer submissions</div>
              </button>

              <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <CreditCard size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Make Payment</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Add funds to your wallet</div>
              </button>

            </div>
          </div>

          {/* Spend Summary */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Spend Summary</h2>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View Report</button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>Total Spent</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>$2,450.00</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
                <ArrowUpRight size={14} /> +12.4% this week
              </div>
            </div>

            {/* Mock Line Chart */}
            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
              {/* Fake SVG line */}
              <svg viewBox="0 0 300 100" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
                <path d="M0,80 Q30,40 60,60 T120,40 T180,60 T240,20 T300,30" fill="none" stroke="rgba(124, 58, 237, 0.5)" strokeWidth="3" strokeLinecap="round" />
                <path d="M0,80 Q30,40 60,60 T120,40 T180,60 T240,20 T300,30 L300,100 L0,100 Z" fill="url(#gradient)" opacity="0.2" />
                <defs>
                  <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              {/* X Axis Labels */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={i} style={{ position: 'relative', zIndex: 1, fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', width: '30px' }}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Performance Overview */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Performance Overview</h2>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View Report</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Top Platform</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ff4500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700 }}>R</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Reddit</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>87.1K Views</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Best Performing Campaign</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={12} color="var(--accent-blue)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Productivity Tips...</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>87.1K Views</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px' }}>
              {/* Fake Bar Chart */}
              {[40, 60, 45, 80, 50, 70, 95].map((val, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <div style={{ 
                    width: '16px', height: `${val}px`, 
                    background: i === 6 ? '#7c3aed' : 'var(--border-medium)', 
                    borderRadius: '4px 4px 0 0' 
                  }} />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
