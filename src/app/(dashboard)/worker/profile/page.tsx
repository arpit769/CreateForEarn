'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, User as UserIcon } from 'lucide-react';
import { deleteUserAccount } from '@/actions/users';
import { createClient } from '@/utils/supabase/client';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
  }, []);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    const res = await deleteUserAccount(user.id);
    if (res.error) {
      alert("Failed to delete account: " + res.error);
    }
    // Note: If successful, the action will sign out the user and redirect to homepage.
    setIsDeleting(false);
  };

  if (!user) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Manage your account settings and preferences.</p>
      </div>

      <div style={{ 
        background: 'var(--bg-elevated)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-subtle)',
        padding: '32px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'var(--gradient-purple)', color: 'var(--btn-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700
          }}>
            {user.email?.[0].toUpperCase() || <UserIcon size={32} />}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Worker Account</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ 
        background: 'var(--bg-elevated)', 
        borderRadius: '16px', 
        border: '1px solid var(--accent-red)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-red)' }}>Danger Zone</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Delete Account</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Permanently delete your account and all of its contents from the CreateForEarn platform. This action is not reversible.
              </p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              style={{ 
                padding: '12px 20px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: 600, 
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-card)', 
                borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)', textAlign: 'center'
              }}
            >
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
              }}>
                <AlertTriangle size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Delete Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.5' }}>
                Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all access to your tasks and wallet.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', flex: 1, opacity: isDeleting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isDeleting ? 'Deleting...' : <><Trash2 size={16} /> Delete</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
