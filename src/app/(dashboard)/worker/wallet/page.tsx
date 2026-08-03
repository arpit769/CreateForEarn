'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  ArrowUpRight, 
  DollarSign, 
  ShieldCheck, 
  Send,
  UserCheck
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUserProfile, updatePaymentDetails } from '@/actions/users';
import { getWalletBalances, requestWithdrawal, getAllWithdrawals } from '@/actions/wallet';

export default function WalletPage() {
  const [profile, setProfile] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Payment Details States
  const [upiUsername, setUpiUsername] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cryptoWalletPolygon, setCryptoWalletPolygon] = useState('');
  const [cryptoWalletCozy, setCryptoWalletCozy] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('polygon_usdt');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'upi' | 'polygon_usdt' | 'cozy'>('upi');
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'crypto_polygon' | 'crypto_bep20'>('upi');

  useEffect(() => {
    async function loadWalletData() {
      try {
        setIsLoading(true);
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
        if (userProfile) {
          const parts = (userProfile.upi_id || '').split('|');
          setUpiUsername(parts.length > 1 ? parts[0] : '');
          setUpiId(parts.length > 1 ? parts[1] : parts[0]);
          
          const cryptoParts = (userProfile.crypto_wallet || '').split('|');
          if (cryptoParts.length > 1) {
            setCryptoWalletPolygon(cryptoParts[0]);
            setCryptoWalletCozy(cryptoParts[1]);
          } else {
            if (userProfile.crypto_network === 'cozy') {
              setCryptoWalletCozy(userProfile.crypto_wallet || '');
              setCryptoWalletPolygon('');
            } else {
              setCryptoWalletPolygon(userProfile.crypto_wallet || '');
              setCryptoWalletCozy('');
            }
          }
          
          setCryptoNetwork(userProfile.crypto_network || 'polygon_usdt');
          if (userProfile.crypto_network === 'cozy') {
            setEditPaymentMethod('cozy');
          } else if (userProfile.crypto_wallet) {
            setEditPaymentMethod('polygon_usdt');
          } else {
            setEditPaymentMethod('upi');
          }
        }

        const walletBalances = await getWalletBalances();
        setBalances(walletBalances);

        // Fetch user's withdrawals directly using client-side Supabase
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userWithdrawals } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (userWithdrawals) {
            setWithdrawals(userWithdrawals);
          }
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWalletData();
  }, []);

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid amount.');
      return;
    }

    if (!balances || balances.availableBalance < amountNum) {
      setErrorMessage('Insufficient available balance.');
      return;
    }

    if (withdrawMethod === 'upi' && !profile?.upi_id) {
      setErrorMessage('Please set your UPI ID in the Profile page first.');
      return;
    }

    if (withdrawMethod.startsWith('crypto') && (!profile?.crypto_wallet || !profile?.crypto_network)) {
      setErrorMessage('Please set your Crypto Wallet & Network in the Profile page first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', withdrawAmount);
      formData.append('method', withdrawMethod);

      const res = await requestWithdrawal(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Withdrawal request submitted successfully!');
        setWithdrawAmount('');
        
        // Reload data
        const walletBalances = await getWalletBalances();
        setBalances(walletBalances);

        const supabase = createClient();
        const { data: userWithdrawals } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        if (userWithdrawals) {
          setWithdrawals(userWithdrawals);
        }
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
        if (!upiUsername || !upiId) {
          throw new Error('Please fill in both UPI Username and UPI ID');
        }
        formData.append('upi_id', `${upiUsername}|${upiId}`);
        formData.append('crypto_wallet', `${cryptoWalletPolygon}|${cryptoWalletCozy}`);
        formData.append('crypto_network', profile?.crypto_network || 'polygon_usdt');
      } else if (editPaymentMethod === 'polygon_usdt') {
        if (!cryptoWalletPolygon) {
          throw new Error('Please enter your Polygon Wallet Address');
        }
        formData.append('upi_id', profile?.upi_id || '');
        formData.append('crypto_wallet', `${cryptoWalletPolygon}|${cryptoWalletCozy}`);
        formData.append('crypto_network', 'polygon_usdt');
      } else if (editPaymentMethod === 'cozy') {
        if (!cryptoWalletCozy) {
          throw new Error('Please enter your Cozy Wallet ID');
        }
        formData.append('upi_id', profile?.upi_id || '');
        formData.append('crypto_wallet', `${cryptoWalletPolygon}|${cryptoWalletCozy}`);
        formData.append('crypto_network', 'cozy');
      }
      
      const res = await updatePaymentDetails(formData);
      if (res.error) {
        setPaymentError(res.error);
      } else {
        setPaymentSuccess('Payment details updated successfully!');
        setIsEditingPayment(false);
        // Refresh profile data
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
        if (userProfile) {
          const parts = (userProfile.upi_id || '').split('|');
          setUpiUsername(parts.length > 1 ? parts[0] : '');
          setUpiId(parts.length > 1 ? parts[1] : parts[0]);
          
          const cryptoParts = (userProfile.crypto_wallet || '').split('|');
          if (cryptoParts.length > 1) {
            setCryptoWalletPolygon(cryptoParts[0]);
            setCryptoWalletCozy(cryptoParts[1]);
          } else {
            if (userProfile.crypto_network === 'cozy') {
              setCryptoWalletCozy(userProfile.crypto_wallet || '');
              setCryptoWalletPolygon('');
            } else {
              setCryptoWalletPolygon(userProfile.crypto_wallet || '');
              setCryptoWalletCozy('');
            }
          }
          setCryptoNetwork(userProfile.crypto_network || 'polygon_usdt');
        }
      }
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading wallet dashboard...</div>;
  }

  // Calculate earnings for EACH reddit account individually
  const redditAccountsList = profile?.reddit_accounts || [];
  
  const accountsEarnings = redditAccountsList.map((acc: any) => {
    let earned = 0;
    let pending = 0;
    let approvedCount = 0;
    let submittedCount = 0;
    
    if (acc.task_claims) {
      acc.task_claims.forEach((claim: any) => {
        const val = Number(claim.tasks?.payment_amount) || 0;
        if (claim.status === 'approved') {
          earned += val;
          approvedCount++;
        } else if (claim.status === 'submitted') {
          pending += val;
          submittedCount++;
        }
      });
    }

    const redditUsername = acc.reddit_profile_link 
      ? acc.reddit_profile_link.replace(/\/$/, '').split('/').pop() 
      : 'Reddit Account';

    return {
      id: acc.id,
      username: redditUsername,
      status: acc.status,
      earned,
      pending,
      approvedCount,
      submittedCount,
      isActive: profile?.active_reddit_account_id === acc.id
    };
  });

  const activeAccountData = accountsEarnings.find((a: any) => a.isActive) || accountsEarnings[0];

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>My Wallet</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Monitor aggregate earnings, view individual profile balances, and request payouts.
        </p>
      </div>

      {/* Grid: 4 Metric Cards (Combined Balances) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        {/* Total Available */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Available Balance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
              <Wallet size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>
            ${(balances?.availableBalance || 0).toFixed(2)}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Combined across all profiles</p>
        </div>

        {/* Total Pending */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Review</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
              <Clock size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#eab308' }}>
            ${(balances?.pendingBalance || 0).toFixed(2)}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Awaiting admin approval</p>
        </div>

        {/* Total Withdrawn / Paid */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Paid Out</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>
            ${(balances?.paidBalance || 0).toFixed(2)}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Successfully transferred</p>
        </div>

        {/* Total Rejected */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Rejected</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
            ${(balances?.rejectedBalance || 0).toFixed(2)}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Disapproved submissions</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', alignItems: 'start', marginBottom: '40px' }}>
        
        {/* Left Side: Profile Breakdowns & Active Profile Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Individual Profile Breakdown List */}
          <div style={{ 
            background: 'var(--bg-elevated)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: '16px', 
            padding: '24px' 
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Reddit Profile Earnings Breakdowns
            </h3>
            
            {accountsEarnings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No linked Reddit profiles detected.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {accountsEarnings.map((acc: any) => (
                  <div 
                    key={acc.id} 
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: 'var(--bg-card)', 
                      border: `1px solid ${acc.isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          u/{acc.username}
                        </span>
                        {acc.isActive && (
                          <span style={{ 
                            fontSize: '11px', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            color: 'var(--accent-blue)', 
                            padding: '2px 8px', 
                            borderRadius: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <UserCheck size={12} /> Active Profile
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        <span>Approved: <strong>{acc.approvedCount} claims</strong></span>
                        <span>Pending: <strong>{acc.submittedCount} claims</strong></span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Earned</p>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>
                        ${acc.earned.toFixed(2)}
                      </p>
                      {acc.pending > 0 && (
                        <p style={{ fontSize: '11px', color: '#eab308', marginTop: '2px' }}>
                          +${acc.pending.toFixed(2)} pending
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Profile Details Section */}
          {activeAccountData && (
            <div style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '16px', 
              padding: '24px',
              borderLeft: '4px solid var(--accent-blue)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--accent-blue)" /> Active Wallet Session
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                You are currently earning on <strong>u/{activeAccountData.username}</strong>. Submissions completed with this profile will credit its individual ledger.
              </p>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profile Earning</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    ${activeAccountData.earned.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending Clearance</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#eab308', marginTop: '4px' }}>
                    ${activeAccountData.pending.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Request Withdrawal & Payout Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ 
            background: 'var(--bg-elevated)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: '16px', 
            padding: '24px' 
          }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} /> Request Withdrawal
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Transfer funds from your available balance.
          </p>

          <form onSubmit={handleWithdrawalRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Amount (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }}>$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 24px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '15px'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Withdrawal Method
              </label>
              <select 
                value={withdrawMethod}
                onChange={(e: any) => setWithdrawMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="upi">
                  UPI ({(() => {
                    if (!profile?.upi_id) return 'Not Set';
                    const parts = profile.upi_id.split('|');
                    return parts.length > 1 ? `${parts[0]} (${parts[1]})` : parts[0];
                  })()})
                </option>
                <option value="crypto_polygon">
                  Polygon USDT ({(() => {
                    if (!profile?.crypto_wallet) return 'Not Set';
                    const parts = profile.crypto_wallet.split('|');
                    const addr = parts.length > 1 ? parts[0] : (profile.crypto_network === 'polygon_usdt' ? profile.crypto_wallet : '');
                    return addr ? addr.slice(0, 8) + '...' : 'Not Set';
                  })()})
                </option>
                <option value="crypto_bep20">
                  Cozy Wallet ({(() => {
                    if (!profile?.crypto_wallet) return 'Not Set';
                    const parts = profile.crypto_wallet.split('|');
                    const id = parts.length > 1 ? parts[1] : (profile.crypto_network === 'cozy' ? profile.crypto_wallet : '');
                    return id ? id : 'Not Set';
                  })()})
                </option>
              </select>
              {withdrawMethod === 'crypto_polygon' && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', wordBreak: 'break-all' }}>
                  Wallet: {(() => {
                    if (!profile?.crypto_wallet) return 'Not configured';
                    const parts = profile.crypto_wallet.split('|');
                    const addr = parts.length > 1 ? parts[0] : (profile.crypto_network === 'polygon_usdt' ? profile.crypto_wallet : '');
                    return addr || 'Not configured';
                  })()}
                </p>
              )}
              {withdrawMethod === 'crypto_bep20' && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', wordBreak: 'break-all' }}>
                  Cozy ID: {(() => {
                    if (!profile?.crypto_wallet) return 'Not configured';
                    const parts = profile.crypto_wallet.split('|');
                    const id = parts.length > 1 ? parts[1] : (profile.crypto_network === 'cozy' ? profile.crypto_wallet : '');
                    return id || 'Not configured';
                  })()}
                </p>
              )}
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

            <button 
              type="submit"
              disabled={isSubmitting || !balances || balances.availableBalance <= 0}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isSubmitting ? 'wait' : 'pointer',
                opacity: (isSubmitting || !balances || balances.availableBalance <= 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              <Send size={16} /> {isSubmitting ? 'Processing...' : 'Request Payout'}
            </button>
          </form>
        </div>

        {/* Payout Details Card */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '16px', 
          padding: '24px' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} /> Payout Details
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Set where you want to receive your earnings.
          </p>

          {!isEditingPayment ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Render UPI details if saved */}
              {profile?.upi_id && (
                <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>UPI Details</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Username: <strong style={{ color: 'var(--text-primary)' }}>{profile.upi_id.split('|')[0]}</strong>
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      UPI ID: <strong style={{ color: 'var(--text-primary)' }}>{profile.upi_id.split('|')[1] || profile.upi_id}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Render Polygon USDT details if saved */}
              {(() => {
                const parts = (profile?.crypto_wallet || '').split('|');
                const addr = parts.length > 1 ? parts[0] : (profile?.crypto_network === 'polygon_usdt' ? profile?.crypto_wallet : '');
                if (!addr) return null;
                return (
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Polygon USDT</span>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all' }}>
                      {addr}
                    </p>
                  </div>
                );
              })()}

              {/* Render Cozy Wallet details if saved */}
              {(() => {
                const parts = (profile?.crypto_wallet || '').split('|');
                const id = parts.length > 1 ? parts[1] : (profile?.crypto_network === 'cozy' ? profile?.crypto_wallet : '');
                if (!id) return null;
                return (
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Cozy Wallet</span>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Cozy Wallet ID: <strong style={{ color: 'var(--text-primary)' }}>{id}</strong>
                    </p>
                  </div>
                );
              })()}

              {/* If nothing is configured */}
              {!profile?.upi_id && !(() => {
                const parts = (profile?.crypto_wallet || '').split('|');
                const addr = parts.length > 1 ? parts[0] : (profile?.crypto_network === 'polygon_usdt' ? profile?.crypto_wallet : '');
                const id = parts.length > 1 ? parts[1] : (profile?.crypto_network === 'cozy' ? profile?.crypto_wallet : '');
                return addr || id;
              })() && (
                <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No payment details set.</p>
                </div>
              )}

              <button
                onClick={() => {
                  setPaymentSuccess('');
                  setPaymentError('');
                  setIsEditingPayment(true);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              >
                Update Details
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePaymentDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Edit Method Tab Bar */}
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('upi')}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: editPaymentMethod === 'upi' ? 'var(--accent-blue)' : 'transparent',
                    color: editPaymentMethod === 'upi' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('polygon_usdt')}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: editPaymentMethod === 'polygon_usdt' ? 'var(--accent-blue)' : 'transparent',
                    color: editPaymentMethod === 'polygon_usdt' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  Polygon
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentMethod('cozy')}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: editPaymentMethod === 'cozy' ? 'var(--accent-blue)' : 'transparent',
                    color: editPaymentMethod === 'cozy' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  Cozy
                </button>
              </div>

              {editPaymentMethod === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                      UPI Username
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={upiUsername}
                      onChange={(e) => setUpiUsername(e.target.value)}
                      required={editPaymentMethod === 'upi'}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)', fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                      UPI ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required={editPaymentMethod === 'upi'}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)', fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              )}

              {editPaymentMethod === 'polygon_usdt' && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Polygon Wallet Address
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0x..."
                    value={cryptoWalletPolygon}
                    onChange={(e) => setCryptoWalletPolygon(e.target.value)}
                    required={editPaymentMethod === 'polygon_usdt'}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>
              )}

              {editPaymentMethod === 'cozy' && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Cozy Wallet ID
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cozy-..."
                    value={cryptoWalletCozy}
                    onChange={(e) => setCryptoWalletCozy(e.target.value)}
                    required={editPaymentMethod === 'cozy'}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>
              )}

              {paymentError && (
                <div style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <AlertCircle size={16} /> {paymentError}
                </div>
              )}

              {paymentSuccess && (
                <div style={{ color: '#22c55e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <CheckCircle size={16} /> {paymentSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingPayment(false)}
                  style={{
                    flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-medium)',
                    borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPayment}
                  style={{
                    flex: 1, padding: '10px', background: 'var(--accent-blue)', border: 'none',
                    borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '13px',
                    cursor: isUpdatingPayment ? 'wait' : 'pointer', opacity: isUpdatingPayment ? 0.7 : 1
                  }}
                >
                  {isUpdatingPayment ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>

      {/* Withdrawal History Section */}
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: '16px', 
        padding: '24px' 
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Withdrawal History
        </h3>

        {withdrawals.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No withdrawal requests found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Method</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Details / Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {w.method === 'upi' ? 'UPI' : w.method === 'crypto_polygon' ? 'Polygon USDT' : w.method === 'crypto_bep20' ? 'Cozy Wallet' : w.method}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${Number(w.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
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
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '250px', wordBreak: 'break-all' }}>
                      {w.transaction_hash || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
