import React from 'react';
import Link from 'next/link';
import { PlaySquare, ClipboardList, ArrowRight } from 'lucide-react';

export default function WorkerHome() {
  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
        Welcome to CreateForEarn Worker Dashboard
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
        Select a platform below to start claiming tasks and earning money. <br/>
        You will need to verify your account for the respective platform first if not verified before you can view available tasks.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Reddit Card */}
        <Link href="/worker/available-tasks" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px',
            height: '100%'
          }}>
            <div style={{ background: 'rgba(255, 69, 0, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={24} color="#FF4500" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Reddit Tasks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                Complete Upvote, Comment, Crosspost, and Post tasks on Reddit. Requires minimum 50 Karma and 20 days account age.
              </p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255, 69, 0, 0.12)', color: '#FF4500',
              border: '1px solid rgba(255, 69, 0, 0.25)',
              padding: '10px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start',
              transition: 'all 0.2s'
            }}>
              Go to Reddit Tasks <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* YouTube Card */}
        <Link href="/worker/youtube-tasks" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px',
            height: '100%'
          }}>
            <div style={{ background: 'rgba(255, 0, 0, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlaySquare size={24} color="#FF0000" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>YouTube Tasks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                Complete Like, Comment, and Subscribe tasks on YouTube. Just verify your channel name if any otherwise just add your username.
              </p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255, 0, 0, 0.12)', color: '#FF0000',
              border: '1px solid rgba(255, 0, 0, 0.25)',
              padding: '10px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start',
              transition: 'all 0.2s'
            }}>
              Go to YouTube Tasks <ArrowRight size={16} />
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
