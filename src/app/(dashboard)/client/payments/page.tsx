'use client';

import React, { useState } from 'react';
import { 
  Wallet, Plus, CreditCard, ArrowUpRight, ArrowDownLeft, 
  Clock, ShieldCheck, Download, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function ClientPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'deposits' | 'payouts'>('all');

  const transactions = [
    {
      id: 'tx-901',
      type: 'deposit',
      description: 'Wallet Top-up (Stripe Credit Card)',
      amount: '+$1,000.00',
      date: 'May 16, 2026',
      time: '14:22',
      status: 'Completed',
      color: '#10b981'
    },
    {
      id: 'tx-902',
      type: 'payout',
      description: 'Campaign Deliverable: New Gadget Review (Aman Verma)',
      amount: '-$35.00',
      date: 'May 18, 2026',
      time: '11:05',
      status: 'Completed',
      color: '#7c3aed'
    },
    {
      id: 'tx-903',
      type: 'payout',
      description: 'Campaign Deliverable: Productivity Tips Thread (Neha Singh)',
      amount: '-$25.00',
      date: 'May 18, 2026',
      time: '09:40',
      status: 'Completed',
      color: '#7c3aed'
    },
    {
      id: 'tx-904',
      type: 'deposit',
      description: 'Wallet Top-up (Bank Wire)',
      amount: '+$2,500.00',
      date: 'May 02, 2026',
      time: '18:15',
      status: 'Completed',
      color: '#10b981'
    },
    {
      id: 'tx-905',
      type: 'payout',
      description: 'Campaign Deliverable: Study Motivation Video (Rahul Das)',
      amount: '-$60.00',
      date: 'May 17, 2026',
      time: '16:30',
      status: 'Completed',
      color: '#7c3aed'
    }
  ];

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'deposits' && tx.type !== 'deposit') return false;
    if (activeTab === 'payouts' && tx.type !== 'payout') return false;
    return true;
  });

  return (
    <div style={{ padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Billing & Wallet
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Manage your account balance, deposit funds, and view campaign disbursement history.
          </p>
        </div>

        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: '#ffffff',
          border: 'none',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)'
        }}>
          <Plus size={16} /> Add Funds to Balance
        </button>
      </div>

      {/* Top Cards: Balance & Payment Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Available Balance */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)', 
          border: '1px solid rgba(124, 58, 237, 0.25)', 
          borderRadius: '18px', 
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Available Balance
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                $1,250.00
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
              <Wallet size={22} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(124, 58, 237, 0.15)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reserved in Escrow</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>$840.00</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Disbursed</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>$2,450.00</div>
            </div>
          </div>
        </div>

        {/* Primary Payment Method */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Payment Method</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>Default</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} color="var(--text-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Visa ending in 4242</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Expires 09/28</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <button style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Edit Card
            </button>
            <button style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              + Add New
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Transaction History</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>All past deposits and task approvals.</p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'deposits', 'payouts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  background: activeTab === tab ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                  color: activeTab === tab ? '#7c3aed' : 'var(--text-secondary)',
                  border: activeTab === tab ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Type</th>
                <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Description</th>
                <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Date & Time</th>
                <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Amount</th>
                <th style={{ paddingBottom: '12px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, i) => (
                <tr key={tx.id} style={{ borderBottom: i === filteredTransactions.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: tx.type === 'deposit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                      color: tx.type === 'deposit' ? '#10b981' : '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {tx.type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {tx.description}
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {tx.date} at {tx.time}
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 700, color: tx.type === 'deposit' ? '#10b981' : 'var(--text-primary)' }}>
                    {tx.amount}
                  </td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '20px'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
