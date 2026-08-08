'use client';

import { use } from 'react';
import Link from 'next/link';
import { Calendar, ArrowLeft, Clock, Tag } from 'lucide-react';
import { blogPosts } from '@/data/blogData';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BlogPostPage({ params }: PageProps) {
  const { id } = use(params);
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Article Not Found
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          The article you are looking for does not exist or has been moved.
        </p>
        <Link 
          href="/blog" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--accent-purple)', 
            fontWeight: 600, 
            textDecoration: 'none' 
          }}
        >
          <ArrowLeft size={16} /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px 64px', color: 'var(--text-secondary)' }}>
      {/* Back Button */}
      <Link 
        href="/blog" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: 'var(--text-muted)', 
          fontWeight: 500, 
          textDecoration: 'none', 
          marginBottom: '40px',
          fontSize: '14px',
          transition: 'color 0.15s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={16} /> Back to Blog
      </Link>

      {/* Category & Metadata */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-purple)', padding: '4px 12px', borderRadius: '100px', fontWeight: 600 }}>
          <Tag size={12} /> {post.category}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} /> {post.date}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} /> {post.readTime}
        </span>
      </div>

      {/* Main Title */}
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px', lineHeight: 1.2 }}>
        {post.title}
      </h1>

      {/* Excerpt / Subtitle */}
      <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '40px', borderLeft: '4px solid var(--accent-purple)', paddingLeft: '20px', fontStyle: 'italic' }}>
        {post.excerpt}
      </p>

      {/* Divider */}
      <hr style={{ border: '0', height: '1px', background: 'var(--border-subtle)', marginBottom: '40px' }} />

      {/* Body Content */}
      <div style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
        {post.content.map((paragraph, index) => (
          <p key={index} style={{ marginBottom: '24px' }}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
