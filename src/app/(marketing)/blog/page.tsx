'use client';

import { Calendar, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      title: "How to Grow Your Subreddit from 0 to 10k Members",
      excerpt: "Building a community requires authentic engagement. Discover simple tactics to jumpstart your growth and build a thriving subreddit.",
      date: "August 4, 2026",
      readTime: "5 min read",
      category: "Marketing"
    },
    {
      title: "How to Write Helpful Comments That Reddit Users Love",
      excerpt: "Quality engagement is rewarded on Reddit. Learn how to write insightful, high-value comments that naturally attract positive karma.",
      date: "July 28, 2026",
      readTime: "4 min read",
      category: "Guide"
    },
    {
      title: "CreateForEarn Launch: Welcome to the Future of Reddit Workforce",
      excerpt: "Today, we are excited to officially launch CreateForEarn. Read about our journey and what is in store for community builders.",
      date: "July 20, 2026",
      readTime: "3 min read",
      category: "News"
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Our Blog
        </h1>
        <p style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Guides, announcements, and tips from the community team at CreateForEarn.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        {posts.map((post, idx) => (
          <div 
            key={idx} 
            style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '24px', 
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <span>{post.category}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {post.date}
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.4 }}>
                {post.title}
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {post.excerpt}
              </p>
            </div>
            
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Read Article <ArrowRight size={14} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
