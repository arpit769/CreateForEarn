'use client';

import React, { useState } from 'react';
import { 
  Headphones, MessageSquare, Mail, HelpCircle, 
  Send, CheckCircle2, Clock, ShieldCheck, Zap, ArrowRight 
} from 'lucide-react';

export default function ClientSupportPage() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('campaign_support');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitted(true);
  };

  return (
    <div style={{ padding: '8px 0 36px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '6px'
        }}>
          Client Support & Help Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          Need assistance with your campaigns, billing, or creators? We're available 24/7.
        </p>
      </div>

      {/* Support Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={20} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Dedicated Account Manager
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Enterprise and high-volume clients receive 1-on-1 strategy & moderation support.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={20} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Fast Response Time
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Average response time under 15 minutes for campaign approval and billing inquiries.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Quality Guarantee
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            All worker submissions are verified against authentic criteria. 100% satisfaction guarantee.
          </p>
        </div>
      </div>

      {/* Ticket Form */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '18px',
        padding: '32px',
        maxWidth: '680px'
      }}>
        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Support Request Received!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              Ticket #SR-{Math.floor(100000 + Math.random() * 900000)} has been created. Our team will contact you shortly.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setMessage('');
                setSubject('');
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#0066FF',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px' }}>
              Send a Support Message
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Inquiry Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="campaign_support">Campaign Setup & Performance</option>
                <option value="billing_wallet">Wallet, Billing & Invoice Inquiry</option>
                <option value="writer_quality">Creator Submission Quality</option>
                <option value="custom_enterprise">Custom Enterprise Campaign</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of your question"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Message & Details
              </label>
              <textarea
                required
                rows={5}
                placeholder="Please describe what you need help with in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0066FF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)'
              }}
            >
              <Send size={16} /> Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
