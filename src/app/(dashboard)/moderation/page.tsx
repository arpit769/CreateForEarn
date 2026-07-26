'use client';

import { useState } from 'react';
import { modQueueItems, timeAgo } from '@/data/mockData';
import type { ModQueueItem } from '@/data/mockData';

const tabs = ['All', 'Reported', 'Spam', 'Unmoderated'];

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [items, setItems] = useState<ModQueueItem[]>(modQueueItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const filteredItems = items.filter((item) => {
    if (activeTab === 'Reported') return item.reportCount > 0;
    if (activeTab === 'Spam') return item.reportReasons.some(r => r.toLowerCase().includes('spam'));
    if (activeTab === 'Unmoderated') return item.status === 'pending';
    return true;
  });

  const handleAction = (id: string, action: 'approved' | 'removed' | 'spam') => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: action as ModQueueItem['status'] } : item
    ));
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };

  return (
    <div className="page-enter">
      {/* Tabs + Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'All' && <span style={{ marginLeft: '6px', opacity: 0.7 }}>({items.filter(i => i.status === 'pending').length})</span>}
            </button>
          ))}
        </div>

        {selectedItems.size > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-success" onClick={() => {
              selectedItems.forEach(id => handleAction(id, 'approved'));
              setSelectedItems(new Set());
            }}>
               Approve ({selectedItems.size})
            </button>
            <button className="btn-danger" onClick={() => {
              selectedItems.forEach(id => handleAction(id, 'removed'));
              setSelectedItems(new Set());
            }}>
               Remove ({selectedItems.size})
            </button>
          </div>
        )}
      </div>

      {/* Select All */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        marginBottom: '12px',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        <div
          onClick={selectAll}
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: `2px solid ${selectedItems.size === filteredItems.length && filteredItems.length > 0 ? 'var(--accent-purple)' : 'var(--border-medium)'}`,
            background: selectedItems.size === filteredItems.length && filteredItems.length > 0 ? 'var(--accent-purple)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
        >
          {selectedItems.size === filteredItems.length && filteredItems.length > 0 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
          )}
        </div>
        <span>Select all ({filteredItems.length} items)</span>
      </div>

      {/* Queue Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            className="glass-card"
            style={{
              padding: '20px',
              opacity: item.status !== 'pending' ? 0.5 : 1,
              animation: `slide-up 0.3s ease-out forwards`,
              animationDelay: `${index * 40}ms`,
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Checkbox */}
              <div
                onClick={() => toggleSelect(item.id)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `2px solid ${selectedItems.has(item.id) ? 'var(--accent-purple)' : 'var(--border-medium)'}`,
                  background: selectedItems.has(item.id) ? 'var(--accent-purple)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {selectedItems.has(item.id) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge ${item.type === 'post' ? 'badge-purple' : 'badge-cyan'}`}>
                    {item.type === 'post' ? ' Post' : ' Comment'}
                  </span>
                  {item.flair && (
                    <span className="badge badge-blue">{item.flair}</span>
                  )}
                  {item.reportCount > 0 && (
                    <span className="badge badge-red"> {item.reportCount} report{item.reportCount > 1 ? 's' : ''}</span>
                  )}
                  {item.status !== 'pending' && (
                    <span className={`badge ${item.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                      {item.status === 'approved' ? ' Approved' : item.status === 'removed' ? ' Removed' : ' Spam'}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', lineHeight: 1.3 }}>
                  {item.title}
                </h4>

                {/* Content Preview */}
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '10px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {item.content}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    u/<strong style={{ color: 'var(--text-secondary)' }}>{item.author}</strong>
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.authorKarma.toLocaleString()} karma
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ⬆ {item.score}
                  </span>
                  {item.commentCount !== undefined && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                       {item.commentCount}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {timeAgo(item.createdAt)}
                  </span>
                </div>

                {/* Report Reasons */}
                {item.reportReasons.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '8px', borderLeft: '3px solid rgba(239, 68, 68, 0.3)' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', marginBottom: '4px' }}>Report Reasons:</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.reportReasons.join(' • ')}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {item.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button
                    className="btn-success"
                    style={{ padding: '7px 14px', fontSize: '12px' }}
                    onClick={() => handleAction(item.id, 'approved')}
                  >
                     Approve
                  </button>
                  <button
                    className="btn-danger"
                    style={{ padding: '7px 14px', fontSize: '12px' }}
                    onClick={() => handleAction(item.id, 'removed')}
                  >
                     Remove
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: '7px 14px', fontSize: '12px', justifyContent: 'center' }}
                    onClick={() => handleAction(item.id, 'spam')}
                  >
                     Spam
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}></p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Queue is empty!</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>All caught up — no items need review.</p>
        </div>
      )}
    </div>
  );
}
