'use client';

import { GitCommit, Star, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  highlights: string[];
  features: string[];
  fixes: string[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: "v1.2.0",
    date: "August 8, 2026",
    type: "minor",
    title: "Community Upgrades & Blog Refactoring",
    highlights: [
      "Replaced standard email support with direct Discord and Telegram integrations for faster help and active discussions.",
      "Optimized light mode styling by correcting the primary purple accents for higher readability."
    ],
    features: [
      "Added Discord Community and Telegram Channel cards to the Help & Support page.",
      "Refactored the blog system to pull entries dynamically from a unified external data module.",
      "Added new helpful resource articles to the blog: 'Earning from Reddit Community Building' and 'Staying Compliant with Reddit's Spam Filters'."
    ],
    fixes: [
      "Fixed invisible text in light mode for elements utilizing --accent-purple.",
      "Adjusted top padding on blog layouts to prevent fixed header overlap."
    ]
  },
  {
    version: "v1.1.0",
    date: "July 28, 2026",
    type: "minor",
    title: "Reddit Syncing & Verification Engine",
    highlights: [
      "Optimized the task verification process for Reddit posts and comments.",
      "Improved performance of the task queue listing."
    ],
    features: [
      "Added warning prompts on the Help page about Reddit profile URL format to reduce accidental task rejections.",
      "Enhanced karma tracker verification algorithms to detect valid subreddit comment submissions."
    ],
    fixes: [
      "Fixed a memory leak during long-running queue checks.",
      "Resolved duplicates in subreddit tags when filtering tasks."
    ]
  },
  {
    version: "v1.0.0",
    date: "July 20, 2026",
    type: "major",
    title: "Initial Launch of CreateForEarn",
    highlights: [
      "Decentralized workforce platform for Reddit is officially live!",
      "Moderators and creators can now earn direct rewards for completing community growth tasks."
    ],
    features: [
      "Built a secure worker dashboard with Wallet withdrawals (Bank & Crypto support).",
      "Created a robust admin portal for queue verification, user management, and task scheduling.",
      "Integrated secure Supabase authentication with custom RLS policies."
    ],
    fixes: [
      "Initial optimization of dashboard charts and layout queries."
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 24px 64px', color: 'var(--text-secondary)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-purple)', padding: '6px 16px', borderRadius: '100px', fontWeight: 600, fontSize: '13px', marginBottom: '16px' }}>
          <GitCommit size={14} /> System Updates
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Product Changelog
        </h1>
        <p style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto', color: 'var(--text-muted)' }}>
          Follow the latest features, improvements, and bug fixes added to CreateForEarn.
        </p>
      </div>

      {/* Timeline Layout */}
      <div style={{ position: 'relative', paddingLeft: '32px', borderLeft: '2px solid var(--border-subtle)' }}>
        {changelogData.map((entry, index) => (
          <div key={entry.version} style={{ position: 'relative', marginBottom: '80px' }}>
            {/* Timeline Dot */}
            <div style={{ 
              position: 'absolute', 
              left: '-43px', 
              top: '4px', 
              width: '20px', 
              height: '20px', 
              borderRadius: '50%', 
              background: entry.type === 'major' ? 'var(--accent-purple)' : 'var(--bg-primary)', 
              border: `4px solid ${entry.type === 'major' ? 'var(--accent-purple-light)' : 'var(--accent-purple)'}`,
              boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)'
            }} />

            {/* Version and Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {entry.version}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                • {entry.date}
              </span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                padding: '2px 8px', 
                borderRadius: '6px', 
                background: entry.type === 'major' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                color: entry.type === 'major' ? 'var(--accent-red)' : 'var(--accent-blue)' 
              }}>
                {entry.type} Release
              </span>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
              {entry.title}
            </h2>

            {/* Content Card */}
            <div style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '20px', 
              padding: '32px', 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' 
            }}>
              {/* Highlights */}
              <div style={{ marginBottom: '24px' }}>
                {entry.highlights.map((highlight, hIdx) => (
                  <p key={hIdx} style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
                    {highlight}
                  </p>
                ))}
              </div>

              {/* Lists of Changes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {entry.features.length > 0 && (
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                      <CheckCircle2 size={16} color="var(--accent-green)" /> Features & Improvements
                    </h4>
                    <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {entry.features.map((feat, fIdx) => (
                        <li key={fIdx} style={{ marginBottom: '8px' }}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.fixes.length > 0 && (
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                      <ShieldAlert size={16} color="var(--accent-orange)" /> Bug Fixes
                    </h4>
                    <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {entry.fixes.map((fix, fxIdx) => (
                        <li key={fxIdx} style={{ marginBottom: '8px' }}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
