'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, CheckCircle2, XCircle, Search, Filter, 
  MoreVertical, ExternalLink, ShieldCheck, Mail, Globe, 
  Calendar, DollarSign, Megaphone, Eye, Check, X, AlertTriangle,
  Loader2, Ban, RefreshCw, ShieldAlert, Sparkles, ChevronDown, ChevronUp,
  Sliders, Save, Plus, ArrowRight, Lock, RotateCcw
} from 'lucide-react';
import { 
  getAllClientUsers, 
  verifyClientUser, 
  rejectClientUser, 
  banClientUser, 
  unbanClientUser,
  updateClientTaskRates
} from '@/actions/users';
import { ClientTaskRates, TaskRateItem, DEFAULT_TASK_RATES } from '@/types/task-rates';
import { PlatformLogo } from '@/components/common/PlatformLogo';

interface BrandClient {
  id: string;
  brandName: string;
  contactName?: string;
  email: string;
  status: 'verified' | 'pending_approval' | 'rejected' | 'banned' | 'pending_details';
  totalCampaigns?: number;
  totalSpent?: number;
  balance?: number;
  joinedDate: string;
  rejection_reason?: string;
  ban_reason?: string;
  task_rates?: ClientTaskRates;
}

type PlatformKey = 'reddit' | 'youtube' | 'x' | 'instagram' | 'linkedin' | 'quora';

const PLATFORM_CONFIG: Record<PlatformKey, { name: string; color: string; bg: string; icon: string }> = {
  reddit: { name: 'Reddit', color: '#FF4500', bg: 'rgba(255, 69, 0, 0.1)', icon: 'r/' },
  youtube: { name: 'YouTube', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: '▶' },
  x: { name: 'X (Twitter)', color: '#000000', bg: 'rgba(0, 0, 0, 0.08)', icon: '𝕏' },
  instagram: { name: 'Instagram', color: '#E1306C', bg: 'rgba(225, 48, 108, 0.1)', icon: '📸' },
  linkedin: { name: 'LinkedIn', color: '#0A66C2', bg: 'rgba(10, 102, 194, 0.1)', icon: 'in' },
  quora: { name: 'Quora', color: '#B92B27', bg: 'rgba(185, 43, 39, 0.1)', icon: 'Q' },
};

export default function AdminClientUsersPage() {
  const [clients, setClients] = useState<BrandClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'banned'>('all');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Selected client for modal / details & rates
  const [selectedClient, setSelectedClient] = useState<BrandClient | null>(null);
  const [editRates, setEditRates] = useState<ClientTaskRates>(DEFAULT_TASK_RATES);
  const [activePlatformTab, setActivePlatformTab] = useState<'all' | PlatformKey>('all');
  const [customAddUpValue, setCustomAddUpValue] = useState<string>('');
  const [isSavingRates, setIsSavingRates] = useState(false);

  // Modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Your brand account does not meet our platform requirements.');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Ban modal
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState('Terms of service violation');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await getAllClientUsers();
      if (res.clients) {
        const mapped: BrandClient[] = res.clients.map((c: any) => ({
          id: c.id,
          brandName: c.full_name || 'Unnamed Brand',
          contactName: c.full_name || 'Brand Owner',
          email: c.email,
          status: c.status || 'pending_approval',
          totalCampaigns: 0,
          totalSpent: 0,
          balance: c.balance || 0,
          joinedDate: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recently',
          rejection_reason: c.rejection_reason,
          ban_reason: c.ban_reason,
          task_rates: c.task_rates || DEFAULT_TASK_RATES,
        }));
        setClients(mapped);
      } else {
        setClients([]);
        if (res.error) {
          showToast(`Error: ${res.error}`, 'error');
        }
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openClientProfileModal = (client: BrandClient) => {
    setSelectedClient(client);
    setEditRates(client.task_rates ? JSON.parse(JSON.stringify(client.task_rates)) : JSON.parse(JSON.stringify(DEFAULT_TASK_RATES)));
    setActivePlatformTab('all');
    setCustomAddUpValue('');
  };

  const handleRateChange = (platform: PlatformKey, action: keyof TaskRateItem, value: number) => {
    setEditRates(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [action]: Math.max(0, value)
      }
    }));
  };

  const handleGlobalRateChange = (action: keyof TaskRateItem, value: number) => {
    const val = Math.max(0, value);
    setEditRates(prev => {
      const updated: any = { ...prev };
      const platforms: PlatformKey[] = ['reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora'];
      platforms.forEach(p => {
        updated[p] = {
          ...updated[p],
          [action]: val
        };
      });
      return updated;
    });
  };

  const handleApplyCustomAddUp = (addVal: number) => {
    if (isNaN(addVal) || addVal === 0) return;
    setEditRates(prev => {
      const updated: any = { ...prev, custom_addup: (prev.custom_addup || 0) + addVal };
      const platforms: PlatformKey[] = ['reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora'];
      platforms.forEach(p => {
        updated[p] = {
          post: Number(Math.max(1, (prev[p]?.post || 10) + addVal).toFixed(2)),
          comment: Number(Math.max(1, (prev[p]?.comment || 5) + addVal).toFixed(2)),
          upvote: Number(Math.max(0.5, (prev[p]?.upvote || 1) + addVal).toFixed(2)),
          reshare: Number(Math.max(1, (prev[p]?.reshare || 3) + addVal).toFixed(2)),
          follow: Number(Math.max(0.5, (prev[p]?.follow || 1) + addVal).toFixed(2)),
        };
      });
      return updated;
    });
    showToast(`Applied +$${addVal.toFixed(2)} custom add-up across all platforms!`);
  };

  const handleResetToDefaults = () => {
    setEditRates(JSON.parse(JSON.stringify(DEFAULT_TASK_RATES)));
    setCustomAddUpValue('');
    showToast('Reset rates to standard defaults ($10 Post, $5 Comments, $1 Upvote, $3 Reshare, $1 Follow).');
  };

  const handleSaveRatesOnly = async () => {
    if (!selectedClient) return;
    setIsSavingRates(true);
    try {
      const res = await updateClientTaskRates(selectedClient.id, editRates);
      if (res.error) {
        showToast(`Save failed: ${res.error}`, 'error');
        setIsSavingRates(false);
        return;
      }
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, task_rates: editRates } : c));
      setSelectedClient(prev => prev ? { ...prev, task_rates: editRates } : null);
      showToast(`Task rates successfully assigned to ${selectedClient.brandName}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update rates', 'error');
    } finally {
      setIsSavingRates(false);
    }
  };

  const handleApproveWithRates = async (client: BrandClient) => {
    setIsProcessing(true);
    try {
      const res = await verifyClientUser(client.id, editRates);
      if (res.error) {
        showToast(`Approval failed: ${res.error}`, 'error');
        setIsProcessing(false);
        return;
      }
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: 'verified', rejection_reason: undefined, task_rates: editRates } : c));
      if (selectedClient?.id === client.id) {
        setSelectedClient({ ...client, status: 'verified', task_rates: editRates });
      }
      showToast(`Brand "${client.brandName}" verified with assigned rates!`);
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedClient) return;
    const finalReason = customRejectReason.trim() || rejectReason;
    setIsProcessing(true);
    try {
      const res = await rejectClientUser(selectedClient.id, finalReason);
      if (res.error) {
        showToast(`Rejection failed: ${res.error}`, 'error');
        setIsProcessing(false);
        return;
      }
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, status: 'rejected', rejection_reason: finalReason } : c));
      setSelectedClient({ ...selectedClient, status: 'rejected', rejection_reason: finalReason });
      setIsRejectModalOpen(false);
      showToast(`Brand "${selectedClient.brandName}" registration rejected.`);
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmBan = async () => {
    if (!selectedClient) return;
    setIsProcessing(true);
    try {
      const res = await banClientUser(selectedClient.id, banReason);
      if (res.error) {
        showToast(`Ban failed: ${res.error}`, 'error');
        setIsProcessing(false);
        return;
      }
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, status: 'banned', ban_reason: banReason } : c));
      setSelectedClient({ ...selectedClient, status: 'banned', ban_reason: banReason });
      setIsBanModalOpen(false);
      showToast(`Brand "${selectedClient.brandName}" has been suspended.`);
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnban = async (client: BrandClient) => {
    setIsProcessing(true);
    try {
      const res = await unbanClientUser(client.id);
      if (res.error) {
        showToast(`Unban failed: ${res.error}`, 'error');
        setIsProcessing(false);
        return;
      }
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: 'verified', ban_reason: undefined } : c));
      if (selectedClient?.id === client.id) {
        setSelectedClient({ ...client, status: 'verified' });
      }
      showToast(`Brand "${client.brandName}" reinstated.`);
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const isPending = c.status === 'pending_approval' || c.status === 'pending_details';
    const matchesTab = 
      filterTab === 'all' ? true :
      filterTab === 'pending' ? isPending :
      filterTab === 'verified' ? c.status === 'verified' :
      filterTab === 'rejected' ? c.status === 'rejected' :
      c.status === 'banned';

    const matchesSearch = 
      c.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contactName && c.contactName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const pendingCount = clients.filter(c => c.status === 'pending_approval' || c.status === 'pending_details').length;
  const verifiedCount = clients.filter(c => c.status === 'verified').length;
  const rejectedCount = clients.filter(c => c.status === 'rejected' || c.status === 'banned').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '8px 0 40px 0' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastMsg.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMsg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Brand Clients Management
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Review, verify, configure custom task rates, and manage brand client accounts.
          </p>
        </div>

        <button
          onClick={fetchClients}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Total Brand Clients
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {clients.length}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          boxShadow: pendingCount > 0 ? '0 0 20px rgba(234, 179, 8, 0.08)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#eab308', textTransform: 'uppercase' }}>
              Pending Verification
            </span>
            {pendingCount > 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#eab308',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                Action Required
              </span>
            )}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#eab308' }}>
            {pendingCount}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', marginBottom: '8px' }}>
            Verified Brands
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e' }}>
            {verifiedCount}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Rejected / Suspended
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-secondary)' }}>
            {rejectedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-surface)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          {(['all', 'pending', 'verified', 'rejected', 'banned'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filterTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: filterTab === tab ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'all' ? 'All Clients' :
               tab === 'pending' ? `Needs Review (${pendingCount})` :
               tab === 'verified' ? `Verified (${verifiedCount})` :
               tab === 'rejected' ? 'Rejected' : 'Banned'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{
          position: 'relative',
          minWidth: '280px',
          flex: 1,
          maxWidth: '400px'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by brand name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Main Table */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '18px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
            <p style={{ fontSize: '14px' }}>Loading client records...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={40} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>No brand clients found</h3>
            <p style={{ fontSize: '13px' }}>No clients match the selected filter or search criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '14px 20px' }}>Brand / Company</th>
                  <th style={{ padding: '14px 20px' }}>Contact Email</th>
                  <th style={{ padding: '14px 20px' }}>Verification Status</th>
                  <th style={{ padding: '14px 20px' }}>Registered On</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const isPending = client.status === 'pending_approval' || client.status === 'pending_details';
                  const isVerified = client.status === 'verified';
                  const isRejected = client.status === 'rejected';
                  const isBanned = client.status === 'banned';

                  return (
                    <tr 
                      key={client.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Brand Info */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: isVerified ? 'rgba(34, 197, 94, 0.1)' : isPending ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isVerified ? '#22c55e' : isPending ? '#eab308' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '16px'
                          }}>
                            {client.brandName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {client.brandName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              ID: {client.id.slice(0, 10)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                          {client.email}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: isVerified ? 'rgba(34, 197, 94, 0.1)' : isPending ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isVerified ? '#22c55e' : isPending ? '#eab308' : '#ef4444',
                          border: `1px solid ${isVerified ? 'rgba(34, 197, 94, 0.2)' : isPending ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                          {isVerified && <CheckCircle2 size={13} />}
                          {isPending && <AlertTriangle size={13} />}
                          {isRejected && <XCircle size={13} />}
                          {isBanned && <Ban size={13} />}
                          {isVerified ? 'Verified' : isPending ? 'Needs Review' : isRejected ? 'Rejected' : 'Banned'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {client.joinedDate}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {/* Dedicated View Profile Button */}
                          <button
                            onClick={() => openClientProfileModal(client)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="View Profile & Assign Platform Task Rates"
                          >
                            <Eye size={13} />
                            View Profile
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveWithRates(client)}
                                disabled={isProcessing}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                                }}
                              >
                                <Check size={13} />
                                Approve
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsRejectModalOpen(true);
                                }}
                                disabled={isProcessing}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <X size={13} />
                                Reject
                              </button>
                            </>
                          )}

                          {isVerified && (
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setIsBanModalOpen(true);
                              }}
                              disabled={isProcessing}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Ban size={12} />
                              Suspend
                            </button>
                          )}

                          {(isRejected || isBanned) && (
                            <button
                              onClick={() => handleUnban(client)}
                              disabled={isProcessing}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Reinstate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && selectedClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            width: '100%',
            maxWidth: '500px',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Reject Brand Client
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {selectedClient.brandName} ({selectedClient.email})
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Preset Reason
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  marginBottom: '12px'
                }}
              >
                <option value="Your brand account does not meet our platform requirements.">Does not meet current requirements</option>
                <option value="Incomplete or unverifiable company/brand details provided.">Incomplete company details</option>
                <option value="Spam or duplicate brand account registration detected.">Duplicate / Invalid registration</option>
                <option value="Custom">Custom message below...</option>
              </select>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Custom Explanation for Brand (Visible to client)
              </label>
              <textarea
                placeholder="Explain why this brand was not approved..."
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isProcessing}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing && <Loader2 size={14} className="animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Ban Modal */}
      {isBanModalOpen && selectedClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            width: '100%',
            maxWidth: '480px',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ban size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Suspend Brand Account
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {selectedClient.brandName}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Suspending this brand will freeze their campaigns and prevent new task creation.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Reason for Suspension
              </label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Terms violation or suspicious activity"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsBanModalOpen(false)}
                disabled={isProcessing}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                disabled={isProcessing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing && <Loader2 size={14} className="animate-spin" />}
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW PROFILE & ASSIGN PLATFORM TASK RATES MODAL */}
      {/* ======================================================== */}
      {selectedClient && !isRejectModalOpen && !isBanModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            width: '100%',
            maxWidth: '780px',
            maxHeight: 'min(88vh, 850px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
            position: 'relative'
          }}>
            {/* Modal Header (Fixed) */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.08))',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  flexShrink: 0
                }}>
                  {selectedClient.brandName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedClient.brandName}
                    </h2>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: selectedClient.status === 'verified' ? 'rgba(34, 197, 94, 0.12)' : (selectedClient.status === 'pending_approval' || selectedClient.status === 'pending_details') ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: selectedClient.status === 'verified' ? '#22c55e' : (selectedClient.status === 'pending_approval' || selectedClient.status === 'pending_details') ? '#eab308' : '#ef4444',
                      border: `1px solid ${selectedClient.status === 'verified' ? 'rgba(34, 197, 94, 0.25)' : (selectedClient.status === 'pending_approval' || selectedClient.status === 'pending_details') ? 'rgba(234, 179, 8, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                      textTransform: 'uppercase'
                    }}>
                      {(selectedClient.status === 'pending_approval' || selectedClient.status === 'pending_details') ? 'Needs Review' : selectedClient.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '3px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedClient.email} &bull; ID: <span style={{ fontFamily: 'monospace', opacity: 0.85 }}>{selectedClient.id.slice(0, 16)}...</span>
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedClient(null)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{
              padding: '22px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* Profile Quick Stats */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Wallet Balance</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    ${(selectedClient.balance || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Registered Date</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedClient.joinedDate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Campaigns</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedClient.totalCampaigns || 0} Launched
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* TASK RATES CONFIGURATION BOX */}
              {/* ======================================================== */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                padding: '18px 20px'
              }}>
                {/* Section Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Sliders size={15} />
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Define Platform Amount Per Task
                      </h3>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      Set the unit amount charged when this client creates tasks. Once configured, rates are <strong style={{ color: 'var(--text-primary)' }}>locked on the client's dashboard</strong>.
                    </p>
                  </div>

                  {/* Lock Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#3b82f6'
                  }}>
                    <Lock size={12} /> Client Rate Lock
                  </span>
                </div>

                {/* Platform Selector Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '10px',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    onClick={() => setActivePlatformTab('all')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: activePlatformTab === 'all' ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
                      background: activePlatformTab === 'all' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                      color: activePlatformTab === 'all' ? '#3b82f6' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🌐 All Platforms (Sync)
                  </button>

                  {(['reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora'] as PlatformKey[]).map(pKey => {
                    const pConf = PLATFORM_CONFIG[pKey];
                    const isSelected = activePlatformTab === pKey;
                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => setActivePlatformTab(pKey)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isSelected ? `1.5px solid ${pConf.color}` : '1px solid var(--border-subtle)',
                          background: isSelected ? pConf.bg : 'var(--bg-card)',
                          color: isSelected ? pConf.color : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <PlatformLogo platform={pKey} size={16} />
                        <span>{pConf.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Task Rate 5-Inputs Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                  gap: '10px',
                  marginBottom: '16px'
                }}>
                  {/* 1. Post ($10 default) */}
                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Post / Video</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px' }}>Def: $10</span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={activePlatformTab === 'all' ? editRates.reddit.post : editRates[activePlatformTab].post}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          if (activePlatformTab === 'all') handleGlobalRateChange('post', v);
                          else handleRateChange(activePlatformTab, 'post', v);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 8px 7px 22px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* 2. Comments ($5 default) */}
                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Comments</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px' }}>Def: $5</span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={activePlatformTab === 'all' ? editRates.reddit.comment : editRates[activePlatformTab].comment}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          if (activePlatformTab === 'all') handleGlobalRateChange('comment', v);
                          else handleRateChange(activePlatformTab, 'comment', v);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 8px 7px 22px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* 3. Upvote ($1 default) */}
                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Upvote / Like</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px' }}>Def: $1</span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.25"
                        value={activePlatformTab === 'all' ? editRates.reddit.upvote : editRates[activePlatformTab].upvote}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          if (activePlatformTab === 'all') handleGlobalRateChange('upvote', v);
                          else handleRateChange(activePlatformTab, 'upvote', v);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 8px 7px 22px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* 4. Reshare ($3 default) */}
                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Reshare / Repost</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px' }}>Def: $3</span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={activePlatformTab === 'all' ? editRates.reddit.reshare : editRates[activePlatformTab].reshare}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          if (activePlatformTab === 'all') handleGlobalRateChange('reshare', v);
                          else handleRateChange(activePlatformTab, 'reshare', v);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 8px 7px 22px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* 5. Follow ($1 default) */}
                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Follow / Join</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px' }}>Def: $1</span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.25"
                        value={activePlatformTab === 'all' ? editRates.reddit.follow : editRates[activePlatformTab].follow}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          if (activePlatformTab === 'all') handleGlobalRateChange('follow', v);
                          else handleRateChange(activePlatformTab, 'follow', v);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 8px 7px 22px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Add-Up Amount Bar */}
                <div style={{
                  background: 'var(--bg-card)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="#eab308" />
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Custom Add-up Tool:
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {[1, 2, 3, 5].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleApplyCustomAddUp(amt)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          +${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Custom $"
                        value={customAddUpValue}
                        onChange={(e) => setCustomAddUpValue(e.target.value)}
                        style={{
                          width: '85px',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(customAddUpValue);
                          if (!isNaN(val) && val !== 0) {
                            handleApplyCustomAddUp(val);
                            setCustomAddUpValue('');
                          }
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Reset to $10 Post, $5 Comment, $1 Upvote, $3 Reshare, $1 Follow"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Fixed at Bottom) */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexWrap: 'wrap',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveRatesOnly}
                disabled={isSavingRates}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid #3b82f6',
                  color: '#3b82f6',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSavingRates ? 'not-allowed' : 'pointer'
                }}
              >
                {isSavingRates ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Rates Only
              </button>

              {(selectedClient.status === 'pending_approval' || selectedClient.status === 'pending_details') && (
                <>
                  <button
                    onClick={() => handleApproveWithRates(selectedClient)}
                    disabled={isProcessing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 20px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                    Approve Brand & Lock Rates
                  </button>

                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isProcessing}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedClient.status === 'verified' && (
                <button
                  onClick={() => setIsBanModalOpen(true)}
                  disabled={isProcessing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Ban size={15} />
                  Suspend Brand
                </button>
              )}

              {(selectedClient.status === 'rejected' || selectedClient.status === 'banned') && (
                <button
                  onClick={() => handleUnban(selectedClient)}
                  disabled={isProcessing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={16} />
                  Reinstate & Verify Brand
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

