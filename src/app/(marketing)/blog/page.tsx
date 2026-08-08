'use client';

import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { blogPosts } from '@/data/blogData';

export default function BlogPage() {
  const posts = blogPosts;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '120px 24px 64px', color: 'var(--text-secondary)' }}>
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
            
            <Link href={`/blog/${post.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Read Article <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
