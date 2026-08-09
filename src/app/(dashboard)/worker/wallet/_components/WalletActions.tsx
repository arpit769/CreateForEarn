'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, Send, Wallet } from 'lucide-react';
import { requestWithdrawal } from '@/actions/wallet';
import { getCurrentUserProfile, updatePaymentDetails } from '@/actions/users';

interface WalletActionsProps {
  profile: any;
  availableBalance: number;
}

export default function WalletActions({ profile: initialProfile, availableBalance }: WalletActionsProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'crypto_polygon' | 'crypto_bep20'>('upi');

  // Payment details states
  const parsedUpi = (profile?.upi_id || '').split('|');
  const parsedCrypto = (profile?.crypto_wallet || '').split('|');
  const [upiUsername, setUpiUsername] = useState(parsedUpi.length > 1 ? parsedUpi[0] : '');
  const [upiId, setUpiId] = useState(parsedUpi.length > 1 ? parsedUpi[1] : parsedUpi[0]);
  const [cryptoWalletPolygon, setCryptoWalletPolygon] = useState(parsedCrypto.length > 1 ? parsedCrypto[0] : (profile?.crypto_network === 'polygon_usdt' ? profile?.crypto_wallet : ''));
  const [cryptoWalletCozy, setCryptoWalletCozy] = useState(parsedCrypto.length > 1 ? parsedCrypto[1] : (profile?.crypto_network === 'cozy' ? profile?.crypto_wallet : ''));
  const [editPaymentMethod, setEditPaymentMethod] = useState<'upi' | 'polygon_usdt' | 'cozy'>('upi');
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) { setErrorMessage('Please enter a valid amount.'); return; }
    if (amountNum < 3.00) { setErrorMessage('Minimum withdrawal amount is $3.00.'); return; }
    if (amountNum > availableBalance) { setErrorMessage('Insufficient available balance.'); return; }
    if (withdrawMethod === 'upi' && !profile?.upi_id) { setErrorMessage('Please set your UPI ID first.'); return; }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', withdrawAmount);
      formData.append('method', withdrawMethod);
      const res = await requestWithdrawal(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Withdrawal request submitted! The page will refresh to show updated balance.');
        setWithdrawAmount('');
        // Refresh page data via server revalidation
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPayment(true);
    setPaymentSuccess('');
    setPaymentError('');
    try {
      const formData = new FormData();
      if (editPaymentMethod === 'upi') {
        if (!upiUsername || !upiId) throw new Error('Please fill in both UPI Username and UPI ID');
        formData.append('upi_id', `${upiUsername}|${upiId}`);
        formData.append('crypto_wallet', `${cryptoWalletPolygon}|${cryptoWalletCozy}`);
        formData.append('crypto_network', profile?.crypto_network || 'polygon_usdt');
      } else if (editPaymentMethod === 'polygon_usdt') {
        if (!cryptoWalletPolygon) throw new Error('Please enter your Polygon Wallet Address');
        formData.append('upi_id', profile?.upi_id || '');
        formData.append('crypto_wallet', `${cryptoWalletPolygon}|${cryptoWalletCozy}`);
        formData.append('crypto_network', 'polygon_usdt');
      } else if (editPaymentMethod === 'cozy') {
        if (!cryptoWalletCozy) throw new Error('Please enter your Cozy Wallet ID');
        formData.append('upi_id', profile?.upi_id || '');
        formData.append('crypto_wallet', `${cryptoWalletPolygon}|${cryptoWalletCozy}`);
        formData.append('crypto_network', 'cozy');
      }
      const res = await updatePaymentDetails(formData);
      if (res.error) {
        setPaymentError(res.error);
      } else {
        setPaymentSuccess('Payment details updated!');
        setIsEditingPayment(false);
        // Refresh profile state
        const updated = await getCurrentUserProfile();
        if (updated) setProfile(updated);
      }
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Request Withdrawal */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} /> Request Withdrawal
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Transfer funds from your available balance.</p>

        <form onSubmit={handleWithdrawalRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Amount (USD)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }}>$</span>
              <input type="number" step="0.01" min="0.01" placeholder="0.00" value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 24px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '15px' }} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Withdrawal Method</label>
            <select value={withdrawMethod} onChange={(e: any) => setWithdrawMethod(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px' }}>
              <option value="upi">UPI ({profile?.upi_id ? `${profile.upi_id.split('|')[0]} (${profile.upi_id.split('|')[1] || profile.upi_id})` : 'Not Set'})</option>
              <option value="crypto_polygon">Polygon USDT ({cryptoWalletPolygon ? cryptoWalletPolygon.slice(0, 8) + '...' : 'Not Set'})</option>
              <option value="crypto_bep20">Cozy Wallet ({cryptoWalletCozy || 'Not Set'})</option>
            </select>
          </div>

          {errorMessage && (
            <div style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}
          {successMessage && (
            <div style={{ color: '#22c55e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.1)' }}>
              <CheckCircle size={16} /> {successMessage}
            </div>
          )}

          <button type="submit" disabled={isSubmitting || availableBalance <= 0}
            style={{ width: '100%', padding: '12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: isSubmitting ? 'wait' : 'pointer', opacity: (isSubmitting || availableBalance <= 0) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
            <Send size={16} /> {isSubmitting ? 'Processing...' : 'Request Payout'}
          </button>
        </form>
      </div>

      {/* Payout Details */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={20} /> Payout Details
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Set where you want to receive your earnings.</p>

        {!isEditingPayment ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profile?.upi_id && (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>UPI Details</span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Username: <strong style={{ color: 'var(--text-primary)' }}>{profile.upi_id.split('|')[0]}</strong></p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>UPI ID: <strong style={{ color: 'var(--text-primary)' }}>{profile.upi_id.split('|')[1] || profile.upi_id}</strong></p>
              </div>
            )}
            {cryptoWalletPolygon && (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Polygon USDT</span>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all' }}>{cryptoWalletPolygon}</p>
              </div>
            )}
            {cryptoWalletCozy && (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Cozy Wallet</span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Cozy Wallet ID: <strong style={{ color: 'var(--text-primary)' }}>{cryptoWalletCozy}</strong></p>
              </div>
            )}
            {!profile?.upi_id && !cryptoWalletPolygon && !cryptoWalletCozy && (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No payment details set.</p>
              </div>
            )}
            <button onClick={() => { setPaymentSuccess(''); setPaymentError(''); setIsEditingPayment(true); }}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              Update Details
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePaymentDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              {(['upi', 'polygon_usdt', 'cozy'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setEditPaymentMethod(m)}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: editPaymentMethod === m ? 'var(--accent-blue)' : 'transparent', color: editPaymentMethod === m ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                  {m === 'upi' ? 'UPI' : m === 'polygon_usdt' ? 'USDT(Polygon)' : 'Cozy'}
                </button>
              ))}
            </div>

            {editPaymentMethod === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>UPI Username</label>
                  <input type="text" placeholder="e.g. John Doe" value={upiUsername} onChange={(e) => setUpiUsername(e.target.value)} required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>UPI ID</label>
                  <input type="text" placeholder="e.g. username@okhdfcbank" value={upiId} onChange={(e) => setUpiId(e.target.value)} required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px' }} />
                </div>
              </div>
            )}
            {editPaymentMethod === 'polygon_usdt' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Polygon Wallet Address</label>
                <input type="text" placeholder="e.g. 0x..." value={cryptoWalletPolygon} onChange={(e) => setCryptoWalletPolygon(e.target.value)} required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>
            )}
            {editPaymentMethod === 'cozy' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Cozy Wallet ID</label>
                <input type="text" placeholder="e.g. Cozy-..." value={cryptoWalletCozy} onChange={(e) => setCryptoWalletCozy(e.target.value)} required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>
            )}

            {paymentError && <div style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.05)', padding: '10px', borderRadius: '8px' }}><AlertCircle size={16} /> {paymentError}</div>}
            {paymentSuccess && <div style={{ color: '#22c55e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.05)', padding: '10px', borderRadius: '8px' }}><CheckCircle size={16} /> {paymentSuccess}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={() => setIsEditingPayment(false)}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isUpdatingPayment}
                style={{ flex: 1, padding: '10px', background: 'var(--accent-blue)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '13px', cursor: isUpdatingPayment ? 'wait' : 'pointer', opacity: isUpdatingPayment ? 0.7 : 1 }}>
                {isUpdatingPayment ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
