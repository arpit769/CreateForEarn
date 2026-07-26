'use client';

import { useState } from 'react';
import { scheduledPosts, postFlairs } from '@/data/mockData';
import type { ScheduledPost } from '@/data/mockData';

const statusColors: Record<string, string> = {
  scheduled: 'badge-cyan',
  posted: 'badge-green',
  draft: 'badge-orange',
  failed: 'badge-red',
};

const statusIcons: Record<string, string> = {
  scheduled: '',
  posted: '',
  draft: '',
  failed: '',
};

export default function SchedulerPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>(scheduledPosts);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'scheduled' | 'draft' | 'posted'>('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    flair: '',
    scheduledAt: '',
    recurring: false,
    recurringInterval: 'weekly',
  });

  const filteredPosts = posts.filter(p => activeFilter === 'all' || p.status === activeFilter);

  const handleSubmit = () => {
    if (!formData.title || !formData.scheduledAt) return;
    const newPost: ScheduledPost = {
      id: `sp${Date.now()}`,
      title: formData.title,
      content: formData.content,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      flair: formData.flair,
      status: 'scheduled',
      recurring: formData.recurring,
      recurringInterval: formData.recurring ? formData.recurringInterval : undefined,
    };
    setPosts(prev => [newPost, ...prev]);
    setFormData({ title: '', content: '', flair: '', scheduledAt: '', recurring: false, recurringInterval: 'weekly' });
    setShowForm(false);
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Activity heatmap data (simplified)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmapData = days.map(() => hours.map(h => {
    let base = 20;
    if (h >= 9 && h <= 17) base = 60;
    if (h >= 12 && h <= 14) base = 80;
    if (h >= 19 && h <= 22) base = 90;
    if (h >= 0 && h <= 6) base = 10;
    return Math.floor(base + Math.random() * 25 - 10);
  }));

  return (
    <div className="page-enter">
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="tab-bar">
          {(['all', 'scheduled', 'draft', 'posted'] as const).map((filter) => (
            <button
              key={filter}
              className={`tab-item ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? ' Cancel' : '+ Schedule Post'}
        </button>
      </div>

      {/* New Post Form */}
      {showForm && (
        <div className="glass-card-static" style={{ padding: '24px', marginBottom: '20px', animation: 'scale-in 0.2s ease-out' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}> Schedule New Post</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Post Title *
              </label>
              <input
                className="input-field"
                placeholder="Enter post title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Content
              </label>
              <textarea
                className="textarea-field"
                placeholder="Write your post content..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Flair
                </label>
                <select
                  className="select-field"
                  value={formData.flair}
                  onChange={(e) => setFormData(prev => ({ ...prev, flair: e.target.value }))}
                >
                  <option value="">Select flair...</option>
                  {postFlairs.map(f => (
                    <option key={f.id} value={f.text}>{f.emoji} {f.text}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Schedule Date & Time *
                </label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Recurring
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px' }}>
                  <div
                    className={`toggle-switch ${formData.recurring ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, recurring: !prev.recurring }))}
                  />
                  {formData.recurring && (
                    <select
                      className="select-field"
                      style={{ width: 'auto' }}
                      value={formData.recurringInterval}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurringInterval: e.target.value }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit}>Schedule Post</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* Scheduled Posts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className="glass-card"
              style={{
                padding: '20px',
                animation: `slide-up 0.3s ease-out forwards`,
                animationDelay: `${index * 40}ms`,
                opacity: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge ${statusColors[post.status]}`}>
                    {statusIcons[post.status]} {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  {post.flair && <span className="badge badge-purple">{post.flair}</span>}
                  {post.recurring && <span className="badge badge-blue"> {post.recurringInterval}</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }}>Edit</button>
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--accent-red)' }}
                    onClick={() => deletePost(post.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{post.title}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '12px',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.content}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                {formatDate(post.scheduledAt)}
              </div>
            </div>
          ))}
        </div>

        {/* Right — Best Time Heatmap */}
        <div className="glass-card-static" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}> Best Time to Post</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Community activity by hour</p>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: '2px', minWidth: '320px' }}>
              {/* Header row */}
              <div />
              {hours.filter((_, i) => i % 3 === 0).map(h => (
                <div key={h} style={{ gridColumn: `span 3`, fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '4px' }}>
                  {h}:00
                </div>
              ))}

              {/* Data rows */}
              {days.map((day, dayIdx) => (
                <>
                  <div key={`label-${day}`} style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', paddingRight: '6px' }}>
                    {day}
                  </div>
                  {heatmapData[dayIdx].map((val, hourIdx) => {
                    const maxVal = Math.max(...heatmapData.flat());
                    const intensity = val / maxVal;
                    return (
                      <div
                        key={`${dayIdx}-${hourIdx}`}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '2px',
                          background: `rgba(255, 255, 255, ${intensity * 0.8 + 0.05})`,
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                        }}
                        title={`${day} ${hourIdx}:00 — ${val} active users`}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Low</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(opacity => (
                <div key={opacity} style={{ width: '16px', height: '8px', borderRadius: '2px', background: `rgba(255, 255, 255, ${opacity})` }} />
              ))}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>High</span>
          </div>

          <div style={{ marginTop: '20px', padding: '14px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '4px' }}> Recommendation</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Best posting times are <strong>Weekdays 12pm–2pm</strong> and <strong>7pm–10pm</strong> for maximum engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
