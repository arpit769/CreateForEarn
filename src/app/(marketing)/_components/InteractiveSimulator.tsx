'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  ImageIcon, 
  Type, 
  Clock, 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: number;
  type: 'comment' | 'image' | 'text';
  subreddit: string;
  payout: number;
  title: string;
  brief: string;
  placeholder: string;
}

const mockTasks: Task[] = [
  {
    id: 12,
    type: 'comment',
    subreddit: 'r/AIContentCreators',
    payout: 0.40,
    title: 'Explain training datasets',
    brief: 'Provide a helpful 2-3 sentence comment explaining how transformer-based models utilize tokenizers during pre-training.',
    placeholder: 'https://reddit.com/r/AIContentCreators/comments/...'
  },
  {
    id: 15,
    type: 'text',
    subreddit: 'r/gaming',
    payout: 0.65,
    title: 'Discussion: Future of VR',
    brief: 'Post a text thread discussing upcoming haptic technologies. Must engage readers with an open-ended question.',
    placeholder: 'https://reddit.com/r/gaming/comments/...'
  },
  {
    id: 19,
    type: 'image',
    subreddit: 'r/programming',
    payout: 0.50,
    title: 'Clean workspace setup',
    brief: 'Share an image post showcasing a clean minimal programming workspace. Submissions must use the discussion flair.',
    placeholder: 'https://reddit.com/r/programming/comments/...'
  }
];

export default function InteractiveSimulator() {
  const [balance, setBalance] = useState<number>(0.00);
  const [activeTab, setActiveTab] = useState<'available' | 'claimed' | 'completed' | 'referrals'>('available');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timer, setTimer] = useState<number>(1800); // 30 minutes in seconds
  const [redditUrl, setRedditUrl] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [completedCount, setCompletedCount] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle timer countdown when task is claimed
  useEffect(() => {
    if (selectedTask && activeTab === 'claimed') {
      setTimer(1800);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedTask, activeTab]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClaim = (task: Task) => {
    setSelectedTask(task);
    setActiveTab('claimed');
    setStatus('idle');
    setRedditUrl('');
  };

  const handleSubmit = () => {
    if (!redditUrl.trim()) return;
    
    setStatus('submitting');
    
    // Simulate admin automated verification logic
    setTimeout(() => {
      setStatus('success');
      setBalance(prev => prev + (selectedTask?.payout || 0));
      setCompletedCount(prev => prev + 1);
      setActiveTab('completed');
    }, 2000);
  };

  const resetSimulator = () => {
    setSelectedTask(null);
    setActiveTab('available');
    setStatus('idle');
    setRedditUrl('');
  };

  return (
    <div className="sim-container" style={{
      padding: '24px',
      background: 'var(--bg-primary)',
      minHeight: '480px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <style>{`
        .sim-container {
          display: grid;
          grid-template-columns: minmax(180px, 220px) 1fr;
          gap: 24px;
        }
        .sim-sidebar {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-subtle);
          padding: 20px 16px;
        }
        .sim-brand-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          padding: 0 8px;
        }
        .sim-tabs-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sim-task-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .sim-task-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          min-width: 100px;
        }
        .sim-submit-row {
          display: flex;
          gap: 8px;
        }
        
        @media (max-width: 768px) {
          .sim-container {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            padding: 16px !important;
          }
          .sim-sidebar {
            gap: 16px !important;
            padding: 16px !important;
          }
          .sim-brand-header {
            margin-bottom: 0 !important;
          }
          .sim-sidebar-top {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            flex-wrap: wrap !important;
            gap: 16px !important;
            border-bottom: 1px solid var(--border-subtle) !important;
            padding-bottom: 16px !important;
            margin-bottom: 8px !important;
          }
          .sim-tabs-container {
            flex-direction: row !important;
            overflow-x: auto !important;
            width: 100% !important;
            gap: 8px !important;
            padding-bottom: 4px !important;
          }
          .sim-tab-btn {
            flex: 1 !important;
            justify-content: center !important;
            white-space: nowrap !important;
            padding: 8px 12px !important;
          }
          .sim-task-card {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .sim-task-right {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            text-align: left !important;
            border-top: 1px solid var(--border-subtle) !important;
            padding-top: 12px !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .sim-submit-row {
            flex-direction: column !important;
          }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <div className="sim-sidebar">
        <div className="sim-sidebar-top">
          <div className="sim-brand-header">
            <img src="/logo.png" alt="CreateForEarn Logo" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
              CreateForEarn
            </span>
          </div>

          <div className="sim-tabs-container">
            {[
              { id: 'available', label: 'Available Tasks', count: mockTasks.length - completedCount, show: true },
              { id: 'claimed', label: 'Active Task', count: selectedTask && activeTab === 'claimed' ? 1 : 0, show: !!selectedTask },
              { id: 'referrals', label: 'Referrals', count: 0, show: true },
              { id: 'completed', label: 'Earnings Summary', count: completedCount, show: true }
            ].filter(t => t.show).map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="sim-tab-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: isActive ? 'var(--hero-glow-4)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span style={{ 
                      padding: '2px 6px', 
                      background: isActive ? 'var(--text-primary)' : 'rgba(255,255,255,0.05)', 
                      color: isActive ? 'var(--bg-primary)' : 'var(--text-muted)',
                      borderRadius: '10px', 
                      fontSize: '10px',
                      marginLeft: '6px'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Wallet Meter */}
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.06)', 
          border: '1px solid rgba(16, 185, 129, 0.15)', 
          borderRadius: '12px', 
          padding: '14px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            <Coins size={12} /> Balance
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* Available Tasks Listing */}
        {activeTab === 'available' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Simulator Tasks</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Try claiming a mock task below to experience the workflow.</p>
            </div>
            
            {mockTasks.map(task => (
              <div key={task.id} className="sim-task-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      {task.subreddit}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {task.type === 'comment' ? <MessageSquare size={10} /> : task.type === 'image' ? <ImageIcon size={10} /> : <Type size={10} />}
                      {task.type.toUpperCase()}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Task ID: {task.id} - {task.title}
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {task.brief}
                  </p>
                </div>

                <div className="sim-task-right">
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
                    +${task.payout.toFixed(2)}
                  </div>
                  <button 
                    onClick={() => handleClaim(task)}
                    style={{
                      padding: '8px 14px', background: 'var(--accent-blue)', color: '#fff',
                      border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', transition: 'background 0.2s'
                    }}
                  >
                    Claim Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Referrals View */}
        {activeTab === 'referrals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Referral Program</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Invite your friends and earn a bonus on every task they complete.</p>
            </div>

            {/* Mock Referral Code Box */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                Your Referral Code
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '4px',
                  fontFamily: 'monospace',
                  background: 'var(--bg-primary)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '2px dashed rgba(168, 85, 247, 0.3)',
                  userSelect: 'all',
                }}>
                  SIMULATOR
                </div>
                <button
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    navigator.clipboard.writeText("SIMULATOR");
                    const origText = btn.innerText;
                    btn.innerText = "Copied!";
                    btn.style.background = "#10b981";
                    setTimeout(() => {
                      btn.innerText = origText;
                      btn.style.background = "var(--text-primary)";
                    }, 1500);
                  }}
                  style={{
                    padding: '12px 20px',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Copy Code
                </button>
              </div>
            </div>

            {/* Referral Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Total Referrals', value: '4' },
                { label: 'Active Friends', value: '3' },
                { label: 'Referral Earnings', value: '$2.00', color: '#10b981' }
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: stat.color || 'var(--text-primary)' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Referral T&C Box */}
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>🎁</span>
              <p style={{ fontSize: '11px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Earn a <strong>$0.50</strong> immediate bonus plus <strong>10% lifetime commission</strong> when your referrals complete tasks.
              </p>
            </div>
          </div>
        )}

        {/* Claimed Task Workflow Panel */}
        {activeTab === 'claimed' && selectedTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            {/* Active timer banner */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--accent-orange)" /> Time Remaining to Submit:
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-orange)' }}>
                {formatTimer(timer)}
              </span>
            </div>

            {/* Target Subreddit / Task Context */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Task Instructions
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Task ID: {selectedTask.id} - {selectedTask.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {selectedTask.brief}
              </p>
              
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Target: {selectedTask.subreddit}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                  Open Target Link <ExternalLink size={10} />
                </span>
              </div>
            </div>

            {/* Proof submission form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Submit Reddit Post/Comment Link
              </label>
              <div className="sim-submit-row">
                <input
                  type="text"
                  placeholder={selectedTask.placeholder}
                  value={redditUrl}
                  onChange={e => setRedditUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  disabled={status === 'submitting' || !redditUrl.trim()}
                  onClick={handleSubmit}
                  style={{
                    padding: '10px 18px',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: (status === 'submitting' || !redditUrl.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (status === 'submitting' || !redditUrl.trim()) ? 0.6 : 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {status === 'submitting' ? 'Verifying...' : 'Submit Proof'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success / Earnings summary screen */}
        {activeTab === 'completed' && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1, 
            textAlign: 'center',
            padding: '24px'
          }}>
            {status === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={48} color="#10b981" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Proof Verified & Paid!
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto 16px' }}>
                  Mock payout of <strong style={{ color: '#10b981' }}>+${selectedTask?.payout.toFixed(2)}</strong> added to your balance. Your linked accounts and inputs are automatically verified.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={40} color="var(--accent-purple)" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Earn Summary
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto 16px' }}>
                  Total simulator payouts accumulated: <strong style={{ color: '#10b981' }}>${balance.toFixed(2)}</strong> across {completedCount} task(s).
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={resetSimulator}
                style={{
                  padding: '10px 16px', background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <RotateCcw size={12} /> Try Again
              </button>

              <Link href="/signup" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '10px 16px', background: 'var(--accent-blue)', color: '#fff',
                    border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  Earn Real Cash <ArrowRight size={12} />
                </button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
