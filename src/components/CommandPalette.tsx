'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ClipboardList, Wallet, Gift, User, Users, CheckSquare, CreditCard,
  X, CornerDownLeft, AlertCircle, Sparkles, MessageSquare, Link as LinkIcon
} from 'lucide-react';
import { getAvailableTasks, getAllTasks } from '@/actions/tasks';

interface SearchItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  category: 'Pages' | 'Tasks';
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export default function CommandPalette({ isOpen, onClose, isAdmin }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define static navigation links based on role
  const navigationItems: SearchItem[] = isAdmin
    ? [
        { id: 'admin-users', name: 'Users Management', href: '/admin/users', icon: <Users size={16} />, category: 'Pages', subtitle: 'Review and approve worker applications' },
        { id: 'admin-tasks', name: 'Tasks Dashboard', href: '/admin/tasks', icon: <ClipboardList size={16} />, category: 'Pages', subtitle: 'Create and manage tasks for workers' },
        { id: 'admin-submissions', name: 'Review Submissions', href: '/admin/submissions', icon: <CheckSquare size={16} />, category: 'Pages', subtitle: 'Approve or reject submitted work' },
        { id: 'admin-withdrawals', name: 'Withdrawals Processing', href: '/admin/withdrawals', icon: <CreditCard size={16} />, category: 'Pages', subtitle: 'Process worker payout requests' },
      ]
    : [
        { id: 'worker-tasks-available', name: 'Available Tasks', href: '/worker/available-tasks', icon: <ClipboardList size={16} />, category: 'Pages', subtitle: 'Browse and claim new tasks' },
        { id: 'worker-tasks-my', name: 'My Tasks', href: '/worker/my-tasks', icon: <CheckSquare size={16} />, category: 'Pages', subtitle: 'Manage your active or completed submissions' },
        { id: 'worker-wallet', name: 'Wallet & Withdrawals', href: '/worker/wallet', icon: <Wallet size={16} />, category: 'Pages', subtitle: 'View balance, history, and request payouts' },
        { id: 'worker-referrals', name: 'Referral Program', href: '/worker/referral', icon: <Gift size={16} />, category: 'Pages', subtitle: 'Invite friends and earn referral bonuses' },
        { id: 'worker-profile', name: 'Profile Settings', href: '/worker/profile', icon: <User size={16} />, category: 'Pages', subtitle: 'Manage account and crypto wallets' },
      ];

  // Fetch tasks on mount or when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const res = await getAllTasks();
          if ('tasks' in res && res.tasks) {
            setTasks(res.tasks);
          }
        } else {
          const res = await getAvailableTasks();
          if ('tasks' in res && res.tasks) {
            setTasks(res.tasks);
          }
        }
      } catch (e) {
        console.error('Failed to load tasks for search:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    setQuery('');
    setSelectedIndex(0);

    // Autofocus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [isOpen, isAdmin]);

  // Convert task list to SearchItems
  const taskItems: SearchItem[] = tasks.map((task) => {
    const isPost = task.task_type === 'post';
    const amount = Number(task.payment_amount) || 0;
    const subredditName = task.subreddits?.name || 'Open for All';
    const seqIdStr = task.task_seq_id ? `#${task.task_seq_id}` : '';
    const nameWithId = seqIdStr ? `${seqIdStr}: ${task.title}` : (task.title || 'Untitled Task');
    const searchVal = seqIdStr || task.title || '';

    return {
      id: `task-${task.id}`,
      name: nameWithId,
      href: isAdmin 
        ? `/admin/tasks?search=${encodeURIComponent(searchVal)}`
        : `/worker/available-tasks?search=${encodeURIComponent(searchVal)}`,
      icon: isPost ? <LinkIcon size={16} /> : <MessageSquare size={16} />,
      category: 'Tasks',
      subtitle: `r/${subredditName} • ${isPost ? 'Post' : 'Comment'} Task`,
      badge: `$${amount.toFixed(2)}`,
      badgeColor: 'var(--accent-green)',
    };
  });

  // Combine and filter search list
  const allItems = [...navigationItems, ...taskItems];
  const filteredItems = allItems.filter((item) => {
    const searchString = `${item.name} ${item.subtitle || ''} ${item.category}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);


  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle select action
  const handleSelect = (item: SearchItem) => {
    router.push(item.href);
    onClose();
  };

  // Close when clicking outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.97, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: -8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              width: '100%',
              maxWidth: '640px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '16px',
              boxShadow: 'var(--glass-shadow), 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '70vh',
            }}
          >
            {/* Search Input Area */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-primary)',
            }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder={isAdmin ? "Search pages, actions, or admin tasks..." : "Search pages, available tasks, or subreddits..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || e.key === 'Esc') {
                    e.preventDefault();
                    onClose();
                  }
                }}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={onClose}
                title="Close Search (ESC)"
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  padding: '3px 8px',
                  background: 'var(--hero-glow-3)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  e.currentTarget.style.background = 'var(--hero-glow-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--hero-glow-3)';
                }}
              >
                ESC
              </button>
            </div>

            {/* Results Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 8px',
              background: 'var(--bg-secondary)',
            }}>
              {loading && filteredItems.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px 24px' }}>
                  <div className="search-spinner" style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '2px solid var(--accent-purple)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s infinite linear',
                  }} />
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Searching database...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No results found</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>No matches for "{query}". Try a different keyword.</p>
                </div>
              ) : (
                <div>
                  {/* Group items by category */}
                  {['Pages', 'Tasks'].map((category) => {
                    const categoryItems = filteredItems.filter((i) => i.category === category);
                    if (categoryItems.length === 0) return null;

                    return (
                      <div key={category} style={{ marginBottom: '12px' }}>
                        <h4 style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'rgba(168, 85, 247, 0.8)',
                          padding: '6px 12px',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          {category === 'Pages' ? <Sparkles size={12} /> : <ClipboardList size={12} />}
                          {category}
                        </h4>

                        {categoryItems.map((item) => {
                          // Find index of item in global filteredItems array
                          const globalIndex = filteredItems.findIndex((fi) => fi.id === item.id);
                          const isSelected = globalIndex === selectedIndex;

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: isSelected ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                                border: '1px solid',
                                borderColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                              }}
                            >
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'var(--hero-glow-1)',
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                              }}>
                                {item.icon}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
                                    {item.name}
                                  </span>
                                  {item.badge && (
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      background: 'rgba(34, 197, 94, 0.12)',
                                      color: item.badgeColor || 'var(--text-secondary)',
                                    }}>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.subtitle && (
                                  <p style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>

                              {isSelected && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  fontWeight: 500,
                                }}>
                                  Go
                                  <CornerDownLeft size={10} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>↑↓ Navigate</span>
                <span>Enter Select</span>
                <span>ESC Close</span>
              </div>
              <div>
                Type to start searching...
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
