'use client';

import { useState } from 'react';
import { postFlairs, userFlairs } from '@/data/mockData';
import type { PostFlair, UserFlair } from '@/data/mockData';

export default function FlairsPage() {
  const [activeTab, setActiveTab] = useState<'post' | 'user'>('post');
  const [postFlairList, setPostFlairList] = useState<PostFlair[]>(postFlairs);
  const [userFlairList, setUserFlairList] = useState<UserFlair[]>(userFlairs);
  const [showForm, setShowForm] = useState(false);
  const [newFlair, setNewFlair] = useState({ text: '', color: '#ffffff', emoji: '' });

  const presetColors = [
    '#ffffff', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373',
    '#525252', '#404040', '#262626', '#171717', '#0a0a0a',
  ];

  const handleAddFlair = () => {
    if (!newFlair.text) return;
    if (activeTab === 'post') {
      const flair: PostFlair = {
        id: `pf${Date.now()}`,
        text: newFlair.text,
        color: newFlair.color,
        bgColor: newFlair.color + '25',
        usageCount: 0,
        emoji: newFlair.emoji || undefined,
      };
      setPostFlairList(prev => [...prev, flair]);
    } else {
      const flair: UserFlair = {
        id: `uf${Date.now()}`,
        text: newFlair.text,
        color: newFlair.color,
        bgColor: newFlair.color + '25',
        editable: true,
      };
      setUserFlairList(prev => [...prev, flair]);
    }
    setNewFlair({ text: '', color: '#ffffff', emoji: '' });
    setShowForm(false);
  };

  const deletePostFlair = (id: string) => setPostFlairList(prev => prev.filter(f => f.id !== id));
  const deleteUserFlair = (id: string) => setUserFlairList(prev => prev.filter(f => f.id !== id));

  return (
    <div className="page-enter">
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="tab-bar">
          <button className={`tab-item ${activeTab === 'post' ? 'active' : ''}`} onClick={() => setActiveTab('post')}>
            Post Flairs ({postFlairList.length})
          </button>
          <button className={`tab-item ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>
            User Flairs ({userFlairList.length})
          </button>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? ' Cancel' : '+ Add Flair'}
        </button>
      </div>

      {/* Add Flair Form */}
      {showForm && (
        <div className="glass-card-static" style={{ padding: '24px', marginBottom: '20px', animation: 'scale-in 0.2s ease-out' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
             Create New {activeTab === 'post' ? 'Post' : 'User'} Flair
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Flair Text *
              </label>
              <input
                className="input-field"
                placeholder="Enter flair text..."
                value={newFlair.text}
                onChange={(e) => setNewFlair(prev => ({ ...prev, text: e.target.value }))}
              />
            </div>
            {activeTab === 'post' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Emoji (optional)
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. "
                  value={newFlair.emoji}
                  onChange={(e) => setNewFlair(prev => ({ ...prev, emoji: e.target.value }))}
                  style={{ maxWidth: '120px' }}
                />
              </div>
            )}
            <button className="btn-primary" onClick={handleAddFlair}>Create Flair</button>
          </div>

          {/* Color Picker */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {presetColors.map(color => (
                <div
                  key={color}
                  onClick={() => setNewFlair(prev => ({ ...prev, color }))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: color,
                    cursor: 'pointer',
                    border: newFlair.color === color ? '3px solid white' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                    transform: newFlair.color === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {newFlair.text && (
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Preview
              </label>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: newFlair.color,
                background: newFlair.color + '20',
                border: `1px solid ${newFlair.color}40`,
              }}>
                {newFlair.emoji} {newFlair.text}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Post Flairs */}
      {activeTab === 'post' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {postFlairList.map((flair, index) => (
            <div
              key={flair.id}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                animation: `slide-up 0.3s ease-out forwards`,
                animationDelay: `${index * 30}ms`,
                opacity: 0,
              }}
            >
              {/* Color Dot */}
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: flair.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${flair.color}60`,
              }} />

              {/* Flair Preview */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: flair.color,
                background: flair.bgColor,
                border: `1px solid ${flair.color}30`,
              }}>
                {flair.emoji} {flair.text}
              </span>

              {/* Usage Count */}
              <div style={{ flex: 1, textAlign: 'right' }}>
                <p style={{ fontSize: '13px', fontWeight: 600 }}>{flair.usageCount.toLocaleString()}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>uses</p>
              </div>

              {/* Delete */}
              <button
                className="btn-ghost"
                style={{ padding: '4px 8px', color: 'var(--accent-red)', fontSize: '12px' }}
                onClick={() => deletePostFlair(flair.id)}
              >
                
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User Flairs */}
      {activeTab === 'user' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {userFlairList.map((flair, index) => (
            <div
              key={flair.id}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                animation: `slide-up 0.3s ease-out forwards`,
                animationDelay: `${index * 30}ms`,
                opacity: 0,
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: flair.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${flair.color}60`,
              }} />

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: flair.color,
                background: flair.bgColor,
                border: `1px solid ${flair.color}30`,
              }}>
                {flair.text}
              </span>

              <div style={{ flex: 1 }} />

              {flair.editable && (
                <span className="badge badge-green" style={{ fontSize: '10px' }}>Editable</span>
              )}

              <button
                className="btn-ghost"
                style={{ padding: '4px 8px', color: 'var(--accent-red)', fontSize: '12px' }}
                onClick={() => deleteUserFlair(flair.id)}
              >
                
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
