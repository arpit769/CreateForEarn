'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Copy, Check, Search, Download } from 'lucide-react';
import { processWithdrawal } from '@/actions/wallet';

type Withdrawal = {
  id: string;
  withdrawal_seq_id?: number | null;
  display_id?: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  transaction_hash: string | null;
  rejection_reason?: string | null;
  created_at: string;
  users: {
    email: string;
    full_name?: string | null;
    upi_id: string | null;
    crypto_wallet: string | null;
    crypto_network: string | null;
  } | null;
};

export default function WithdrawalsTable({ initialWithdrawals }: { initialWithdrawals: Withdrawal[] }) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Processing Modal / Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'pay' | 'reject' | null>(null);
  const [txHash, setTxHash] = useState('');
  const [rejectReason, setRejectReason] = useState('Incorrect payment details (Invalid UPI ID / Wallet Address)');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    setProcessingId(null);
    setActionType(null);
    setTxHash('');
    setRejectReason('Incorrect payment details (Invalid UPI ID / Wallet Address)');
    setCustomRejectReason('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingId || !actionType) return;
    
    const finalReason = actionType === 'reject'
      ? (rejectReason === 'custom' ? customRejectReason.trim() : rejectReason)
      : null;

    if (actionType === 'reject' && !finalReason) {
      alert("Please provide a rejection reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('withdrawal_id', processingId);
      formData.append('status', actionType === 'pay' ? 'paid' : 'rejected');
      if (actionType === 'pay' && txHash) {
        formData.append('transaction_hash', txHash);
      }
      if (actionType === 'reject' && finalReason) {
        formData.append('rejection_reason', finalReason);
      }

      const res = await processWithdrawal(formData);
      if (res.error) {
        alert("Error: " + res.error);
      } else {
        // Update local state
        setWithdrawals(prev => prev.map(w => {
          if (w.id === processingId) {
            return {
              ...w,
              status: actionType === 'pay' ? 'paid' : 'rejected',
              transaction_hash: actionType === 'pay' ? (txHash || 'Marked Paid') : null,
              rejection_reason: actionType === 'reject' ? finalReason : null
            };
          }
          return w;
        }));
        // Reset states
        resetModal();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert("Failed: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure all withdrawals have a consistent, deterministic sequential ID (T-1, T-2, T-3...)
  const normalizedWithdrawals = useMemo(() => {
    // Sort chronologically (oldest first) to assign sequence numbers 1, 2, 3...
    const chronological = [...withdrawals].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const idMap = new Map<string, string>();
    chronological.forEach((w, idx) => {
      const seq = w.withdrawal_seq_id ? Number(w.withdrawal_seq_id) : idx + 1;
      idMap.set(w.id, w.display_id || `T-${seq}`);
    });

    return withdrawals.map((w, index) => {
      const display_id = idMap.get(w.id) || w.display_id || (w.withdrawal_seq_id ? `T-${w.withdrawal_seq_id}` : `T-${index + 1}`);
      return {
        ...w,
        display_id,
      };
    });
  }, [withdrawals]);

  const filtered = normalizedWithdrawals.filter(w => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    const idMatch = w.display_id ? w.display_id.toLowerCase().includes(q) : false;
    const numMatch = w.withdrawal_seq_id
      ? String(w.withdrawal_seq_id) === q || `t-${w.withdrawal_seq_id}` === q
      : false;

    return (
      idMatch ||
      numMatch ||
      w.users?.email.toLowerCase().includes(q) ||
      (w.users?.full_name && w.users.full_name.toLowerCase().includes(q)) ||
      w.method.toLowerCase().includes(q) ||
      w.status.toLowerCase().includes(q)
    );
  });

  // Export to CSV
  const exportToCsv = () => {
    const rows = [
      ['Withdrawal ID', 'User Name', 'User Email', 'Amount ($)', 'Payment Method', 'Recipient Details', 'Crypto Network', 'Status', 'Date Requested', 'Transaction Hash / Ref', 'Rejection Reason']
    ];

    for (const w of filtered) {
      const recipient = w.method === 'UPI' 
        ? (w.users?.upi_id || 'N/A')
        : (w.users?.crypto_wallet || 'N/A');

      const dateStr = new Date(w.created_at).toLocaleString();

      rows.push([
        w.display_id || '',
        `"${(w.users?.full_name || '').replace(/"/g, '""')}"`,
        w.users?.email || '',
        w.amount.toFixed(2),
        w.method,
        `"${recipient.replace(/"/g, '""')}"`,
        w.users?.crypto_network || '',
        w.status,
        `"${dateStr.replace(/"/g, '""')}"`,
        `"${(w.transaction_hash || '').replace(/"/g, '""')}"`,
        `"${(w.rejection_reason || '').replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `withdrawals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Manage Withdrawals</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Process pending payout requests, view wallet details, and record transaction hashes.
        </p>
      </div>

      {/* Search & Actions Bar */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by ID (e.g. T-1), user email, status, method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={exportToCsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            borderRadius: '10px',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          title="Download withdrawals as CSV"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Main Table Card (Desktop) */}
      <div className="admin-desktop-table" style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600, width: '90px' }}>ID</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>User / Date</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Method</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Recipient Details</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  let recipientDetails = '';
                  let rawCopyValue = '';
                  if (w.method === 'upi' && w.users?.upi_id) {
                    const parts = w.users.upi_id.split('|');
                    if (parts.length > 1) {
                      recipientDetails = `ID: ${parts[1]}`;
                      rawCopyValue = parts[1];
                    } else {
                      recipientDetails = `ID: ${parts[0]}`;
                      rawCopyValue = parts[0];
                    }
                  } else if (w.method === 'crypto_polygon' && w.users?.crypto_wallet) {
                    recipientDetails = w.users.crypto_wallet;
                    rawCopyValue = w.users.crypto_wallet;
                  } else if (w.method === 'crypto_bep20' && w.users?.crypto_wallet) {
                    recipientDetails = `Cozy ID: ${w.users.crypto_wallet}`;
                    rawCopyValue = w.users.crypto_wallet;
                  } else if (w.users?.crypto_wallet) {
                    recipientDetails = w.users.crypto_wallet;
                    rawCopyValue = w.users.crypto_wallet;
                  }

                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {/* Withdrawal ID (e.g. T-1, T-2) */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: '0.02em',
                          background: 'rgba(255, 69, 0, 0.12)',
                          color: '#ff6b35',
                          border: '1px solid rgba(255, 69, 0, 0.28)'
                        }}>
                          {w.display_id}
                        </span>
                      </td>

                      {/* User & Date */}
                      <td style={{ padding: '16px 24px' }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {w.users?.full_name || w.users?.email}
                        </p>
                        {w.users?.full_name && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                            {w.users?.email}
                          </p>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          {new Date(w.created_at).toLocaleString()}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '16px 24px', fontWeight: 700, color: '#22c55e', fontSize: '15px' }}>
                        ${Number(w.amount).toFixed(2)}
                      </td>

                      {/* Method */}
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {w.method === 'upi' ? 'UPI' : w.method === 'crypto_polygon' ? 'Polygon USDT' : w.method === 'crypto_bep20' ? 'Cozy Wallet' : w.method}
                      </td>

                      {/* Recipient Details & Copy Action */}
                      <td style={{ padding: '16px 24px' }}>
                        {recipientDetails ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <code style={{ background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-primary)', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {recipientDetails}
                            </code>
                            <button
                              onClick={() => copyToClipboard(rawCopyValue, w.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedId === w.id ? '#22c55e' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                            >
                              {copiedId === w.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Configured</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: w.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : w.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                          color: w.status === 'paid' ? '#22c55e' : w.status === 'rejected' ? '#ef4444' : '#eab308'
                        }}>
                          {w.status}
                        </span>
                        {w.status === 'paid' && w.transaction_hash && (
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Tx: {w.transaction_hash}
                          </p>
                        )}
                        {w.status === 'rejected' && w.rejection_reason && (
                          <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', maxWidth: '180px', wordBreak: 'break-word', lineHeight: 1.3 }}>
                            Reason: {w.rejection_reason}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 24px' }}>
                        {w.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setProcessingId(w.id);
                                setActionType('pay');
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#22c55e',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle2 size={13} /> Mark Paid
                            </button>
                            <button
                              onClick={() => {
                                setProcessingId(w.id);
                                setActionType('reject');
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setProcessingId(w.id);
                                setActionType('pay');
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: w.status === 'paid' ? '#22c55e' : 'rgba(34, 197, 94, 0.15)',
                                color: w.status === 'paid' ? '#fff' : '#22c55e',
                                border: `1px solid ${w.status === 'paid' ? '#22c55e' : 'rgba(34, 197, 94, 0.3)'}`,
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle2 size={13} /> {w.status === 'paid' ? 'Paid ✓' : 'Mark Paid'}
                            </button>
                            <button
                              onClick={() => {
                                setProcessingId(w.id);
                                setActionType('reject');
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: w.status === 'rejected' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                                color: w.status === 'rejected' ? '#fff' : '#ef4444',
                                border: `1px solid ${w.status === 'rejected' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <XCircle size={13} /> {w.status === 'rejected' ? 'Rejected ✗' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards System */}
      <div className="admin-mobile-cards">
        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            No withdrawal requests found.
          </div>
        ) : (
          filtered.map((w) => {
            let recipientDetails = '';
            let rawCopyValue = '';
            if (w.method === 'upi' && w.users?.upi_id) {
              const parts = w.users.upi_id.split('|');
              if (parts.length > 1) {
                recipientDetails = `ID: ${parts[1]}`;
                rawCopyValue = parts[1];
              } else {
                recipientDetails = `ID: ${parts[0]}`;
                rawCopyValue = parts[0];
              }
            } else if (w.method === 'crypto_polygon' && w.users?.crypto_wallet) {
              recipientDetails = w.users.crypto_wallet;
              rawCopyValue = w.users.crypto_wallet;
            } else if (w.method === 'crypto_bep20' && w.users?.crypto_wallet) {
              recipientDetails = `Cozy ID: ${w.users.crypto_wallet}`;
              rawCopyValue = w.users.crypto_wallet;
            } else if (w.users?.crypto_wallet) {
              recipientDetails = w.users.crypto_wallet;
              rawCopyValue = w.users.crypto_wallet;
            }

            const methodLabel = w.method === 'upi' ? 'UPI' : w.method === 'crypto_polygon' ? 'Polygon USDT' : w.method === 'crypto_bep20' ? 'Cozy Wallet' : w.method;

            return (
              <div key={w.id} className="admin-card-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        letterSpacing: '0.02em',
                        background: 'rgba(255, 69, 0, 0.12)',
                        color: '#ff6b35',
                        border: '1px solid rgba(255, 69, 0, 0.28)'
                      }}>
                        {w.display_id}
                      </span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', wordBreak: 'break-word', margin: 0 }}>
                        {w.users?.full_name || w.users?.email}
                      </p>
                    </div>
                    {w.users?.full_name && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                        {w.users?.email}
                      </p>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{new Date(w.created_at).toLocaleString()}</span>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap' }}>
                    ${Number(w.amount).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'var(--hero-glow-1)', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {methodLabel}
                  </span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: w.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : w.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                    color: w.status === 'paid' ? '#22c55e' : w.status === 'rejected' ? '#ef4444' : '#eab308'
                  }}>
                    {w.status}
                  </span>
                </div>

                {recipientDetails ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                    <code style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, wordBreak: 'break-all' }}>
                      {recipientDetails}
                    </code>
                    <button
                      onClick={() => copyToClipboard(rawCopyValue, w.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedId === w.id ? '#22c55e' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}
                    >
                      {copiedId === w.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Recipient: Not Configured</p>
                )}

                {w.status === 'paid' && w.transaction_hash && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
                    Tx: {w.transaction_hash}
                  </p>
                )}

                {w.status === 'rejected' && w.rejection_reason && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', marginBottom: '2px' }}>Rejection Reason:</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{w.rejection_reason}</p>
                  </div>
                )}

                {w.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => {
                        setProcessingId(w.id);
                        setActionType('pay');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCircle2 size={13} /> Mark Paid
                    </button>
                    <button
                      onClick={() => {
                        setProcessingId(w.id);
                        setActionType('reject');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                    </div>
                  ) : (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => {
                        setProcessingId(w.id);
                        setActionType('pay');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: w.status === 'paid' ? '#22c55e' : 'rgba(34, 197, 94, 0.15)',
                        color: w.status === 'paid' ? '#fff' : '#22c55e',
                        border: `1px solid ${w.status === 'paid' ? '#22c55e' : 'rgba(34, 197, 94, 0.3)'}`,
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCircle2 size={13} /> {w.status === 'paid' ? 'Paid ✓' : 'Mark Paid'}
                    </button>
                    <button
                      onClick={() => {
                        setProcessingId(w.id);
                        setActionType('reject');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: w.status === 'rejected' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                        color: w.status === 'rejected' ? '#fff' : '#ef4444',
                        border: `1px solid ${w.status === 'rejected' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <XCircle size={13} /> {w.status === 'rejected' ? 'Rejected ✗' : 'Reject'}
                    </button>
                  </div>
                  )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Dialog / Modal Overlay */}
      <AnimatePresence>
        {processingId && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '12px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="admin-modal-box"
              style={{
                maxWidth: '460px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
              }}
            >
              {(() => {
                const activeWithdrawal = normalizedWithdrawals.find(w => w.id === processingId);
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{actionType === 'pay' ? 'Mark Payout as Paid' : 'Reject Payout Request'}</span>
                        {activeWithdrawal?.display_id && (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: 'rgba(255, 69, 0, 0.15)',
                            color: '#ff6b35',
                            border: '1px solid rgba(255, 69, 0, 0.3)'
                          }}>
                            {activeWithdrawal.display_id}
                          </span>
                        )}
                      </h3>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      User: <strong style={{ color: 'var(--text-primary)' }}>{activeWithdrawal?.users?.full_name || activeWithdrawal?.users?.email}</strong> &bull; Amount: <strong style={{ color: '#22c55e' }}>${Number(activeWithdrawal?.amount || 0).toFixed(2)}</strong>
                    </p>
                  </>
                );
              })()}
              
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                {actionType === 'pay' 
                  ? 'Confirm that you have completed this transaction. You can optionally enter a transaction hash / reference ID below.'
                  : 'Are you sure you want to reject this withdrawal request? The requested amount will be immediately refunded back to the user\'s available wallet balance.'}
              </p>

              <form onSubmit={handleAction}>
                {actionType === 'pay' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Transaction Hash / Reference ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI Ref / Tx Hash"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {actionType === 'reject' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Rejection Reason <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        marginBottom: rejectReason === 'custom' ? '12px' : '0'
                      }}
                    >
                      <option value="Incorrect payment details (Invalid UPI ID / Wallet Address)">Incorrect payment details (Invalid UPI ID / Wallet Address)</option>
                      <option value="Payment details do not match account profile">Payment details do not match account profile</option>
                      <option value="Suspicious activity / Account under review">Suspicious activity / Account under review</option>
                      <option value="Duplicate withdrawal request">Duplicate withdrawal request</option>
                      <option value="custom">Custom Reason...</option>
                    </select>

                    {rejectReason === 'custom' && (
                      <textarea
                        placeholder="Type specific rejection reason for the user..."
                        value={customRejectReason}
                        onChange={(e) => setCustomRejectReason(e.target.value)}
                        required
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={resetModal}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: actionType === 'pay' ? '#22c55e' : '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: isSubmitting ? 'wait' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? 'Processing...' : actionType === 'pay' ? 'Confirm Payout' : 'Reject Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </An