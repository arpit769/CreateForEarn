import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#FF4500" />
                <path fill="#FFFFFF" d="M12 10.3c-.6 0-1.1.4-1.2 1-.8.2-1.7.4-2.7.5l.6-2.8 1.9.4c.1.5.6.9 1.2.9.7 0 1.2-.5 1.2-1.2 0-.7-.5-1.2-1.2-1.2-.5 0-1 .3-1.2.8l-2.1-.4c-.1 0-.2.1-.3.2l-.7 3.2c-1-.1-1.9-.3-2.7-.5-.1-.6-.6-1-1.2-1-.7 0-1.2.5-1.2 1.2 0 .6.4 1.1.9 1.2 0 .3-.1.6-.1.9 0 2.4 2.5 4.3 5.6 4.3s5.6-1.9 5.6-4.3c0-.3 0-.6-.1-.9.6-.1 1-.6 1-1.2.1-.7-.4-1.2-1.1-1.2zm-6.6 2.9c0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7-.4 0-.7-.3-.7-.7zm4.8 2.2c-.6.6-1.7.6-2.2.6s-1.6 0-2.2-.6c-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .4.4 1.2.5 1.8.5s1.4-.1 1.8-.5c.1-.1.3-.1.4 0 .1.1.1.3 0 .4zm-.2-1.5c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7z" />
              </svg>
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
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000" />
                <polygon points="9.75,15.02 15.75,12 9.75,8.98" fill="#FFFFFF" />
              </svg>
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

        {/* X (Twitter) Card */}
        <Link href="/worker/x-tasks" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px',
            height: '100%'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>X (Twitter) Tasks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                Complete Post, Comment, Like, Repost, Quote Post, Follow, and Bookmark tasks on X. Link your X handle to get started.
              </p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              padding: '10px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start',
              transition: 'all 0.2s'
            }}>
              Go to X Tasks <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* Quora Card */}
        <Link href="/worker/quora-tasks" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px',
            height: '100%'
          }}>
            <div style={{ background: 'rgba(185, 43, 39, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#B92B27">
                <path d="M12.012 2c-5.508 0-9.972 4.47-9.972 9.984 0 2.376.83 4.558 2.22 6.275l-1.637 2.766a.8.8 0 0 0 .977 1.144l3.05-.98a9.92 9.92 0 0 0 5.362 1.551c5.508 0 9.972-4.47 9.972-9.984C21.984 6.47 17.52 2 12.012 2zm2.09 15.827l-1.044-1.748c-.336.053-.68.082-1.03.082-3.1 0-5.613-2.513-5.613-5.613S8.93 5.935 12.03 5.935s5.613 2.513 5.613 5.613c0 1.777-.826 3.361-2.115 4.39l1.63 2.727-3.056-.838zm-2.09-9.52a2.81 2.81 0 1 0 0 5.62 2.81 2.81 0 0 0 0-5.62z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Quora Tasks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                Complete Answer, Upvote, Follow, Follow Topic, Comment, and Share tasks on Quora. Link your Quora profile to get started.
              </p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(185, 43, 39, 0.12)', color: '#b92b27',
              border: '1px solid rgba(185, 43, 39, 0.25)',
              padding: '10px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start',
              transition: 'all 0.2s'
            }}>
              Go to Quora Tasks <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* Instagram Card */}
        <Link href="/worker/instagram-tasks" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px',
            height: '100%'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(131,58,180,0.12), rgba(253,29,29,0.12))', 
              width: '48px', height: '48px', borderRadius: '12px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <defs>
                  <radialGradient id="ig-home-card" cx="20%" cy="110%" r="130%" fx="20%" fy="110%">
                    <stop offset="0%" stopColor="#FFDD55"/>
                    <stop offset="20%" stopColor="#FF543E"/>
                    <stop offset="60%" stopColor="#C837AB"/>
                    <stop offset="100%" stopColor="#3771C8"/>
                  </radialGradient>
                </defs>
                <rect width="24" height="24" rx="6" fill="url(#ig-home-card)"/>
                <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
                <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" fill="none"/>
                <circle cx="17.2" cy="6.8" r="1.2" fill="white"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Instagram Tasks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                Complete Post, Comment, Like, Follow, Save, Reel View, and Story View tasks on Instagram. Link your Instagram handle to get started.
              </p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(225, 48, 108, 0.12)', color: '#E1306C',
              border: '1px solid rgba(225, 48, 108, 0.25)',
              padding: '10px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start',
              transition: 'all 0.2s'
            }}>
              Go to Instagram Tasks <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* LinkedIn Card */}
        <Link href="/worker/linkedin-tasks" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px',
            height: '100%'
          }}>
            <div style={{ 
              background: 'rgba(10, 102, 194, 0.1)', 
              width: '48px', height: '48px', borderRadius: '12px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.85 18.5V10.13H5.06V18.5h2.79z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>LinkedIn Tasks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                Complete Post, Comment, Like/Reaction, Repost, Follow, Connect, and Share tasks on LinkedIn. Link your LinkedIn profile to get started.
              </p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(10, 102, 194, 0.12)', color: '#0A66C2',
              border: '1px solid rgba(10, 102, 194, 0.25)',
              padding: '10px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start',
              transition: 'all 0.2s'
            }}>
              Go to LinkedIn Tasks <ArrowRight size={16} />
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}

