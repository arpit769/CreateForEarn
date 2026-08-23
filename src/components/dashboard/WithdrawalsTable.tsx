'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Copy, ExternalLink, Check, Search } from 'lucide-react';
import { processWithdrawal } from '@/actions/wallet';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  transaction_hash: string | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingId || !actionType) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('withdrawal_id', processingId);
      formData.append('status', actionType === 'pay' ? 'paid' : 'rejected');
      if (actionType === 'pay' && txHash) {
        formData.append('transaction_hash', txHash);
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
              transaction_hash: actionType === 'pay' ? txHash || 'Marked Paid' : null
            };
          }
          return w;
        }));
        // Reset states
        setProcessingId(null);
        setActionType(null);
        setTxHash('');
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = withdrawals.filter(w => 
    w.users?.email.toLowerCase().includes(search.toLowerCase()) ||
    (w.users?.full_name && w.users.full_name.toLowerCase().includes(search.toLowerCase())) ||
    w.method.toLowerCase().includes(search.toLowerCase()) ||
    w.status.toLowerCase().includes(search.toLowerCase())
  );

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
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by user email, status, method..."
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
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', wordBreak: 'break-word' }}>
                      {w.users?.full_name || w.users?.email}
                    </p>
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
                maxWidth: '440px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                {actionType === 'pay' ? 'Mark Payout as Paid' : 'Reject Payout Request'}
              </h3>
              
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                {actionType === 'pay' 
                  ? 'Confirm that you have completed this transaction. You can optionally enter a transaction hash / reference ID below.'
                  : 'Are you sure you want to reject this withdrawal request? The funds will remain locked/rejected.'}
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

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setProcessingId(null);
                      setActionType(null);
                      setTxHash('');
                    }}
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
      </AnimatePresence>

    </div>
  );
}
