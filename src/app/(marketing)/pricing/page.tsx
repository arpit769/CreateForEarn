'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, Send, BarChart3, Crown, Building2
} from 'lucide-react';

const clientPlans = [
  {
    name: 'Starter',
    desc: 'Perfect for getting started',
    price: '$29',
    period: '/month',
    icon: Send,
    features: [
      '1 Active Campaign',
      '10 Content Submissions',
      'Basic Analytics',
      'Email Support',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Growth',
    desc: 'For growing communities',
    price: '$79',
    period: '/month',
    icon: BarChart3,
    features: [
      '3 Active Campaigns',
      '50 Content Submissions',
      'Advanced Analytics',
      'Priority Support',
    ],
    cta: 'Get Started',
    featured: true,
  },
  {
    name: 'Pro',
    desc: 'For serious growth',
    price: '$149',
    period: '/month',
    icon: Crown,
    features: [
      '10 Active Campaigns',
      '200 Content Submissions',
      'Advanced Analytics',
      'Priority Support',
      'Custom Requirements',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Enterprise',
    desc: 'For large organizations',
    price: 'Custom',
    period: '',
    icon: Building2,
    features: [
      'Unlimited Campaigns',
      'Unlimited Submissions',
      'Custom Analytics',
      'Dedicated Support',
      'Custom Requirements',
    ],
    cta: 'Contact Us',
    featured: false,
  },
];

const writerPlans = [
  {
    name: 'Free',
    desc: 'Start earning immediately',
    price: '$0',
    period: '/ forever',
    icon: Send,
    features: [
      'Access to all tasks',
      'Keep 100% of earnings',
      'Basic analytics dashboard',
      'Email support',
    ],
    cta: 'Start Earning',
    featured: false,
  },
  {
    name: 'Pro Writer',
    desc: 'For serious writers',
    price: '$9',
    period: '/month',
    icon: Crown,
    features: [
      'Priority task access',
      'Advanced analytics',
      'Performance bonuses',
      'Priority support',
      'Early task notifications',
    ],
    cta: 'Go Pro',
    featured: true,
  },
];

export default function PricingPage() {
  const [tab, setTab] = useState<'clients' | 'writers'>('clients');
  const plans = tab === 'clients' ? clientPlans : writerPlans;

  return (
    <div>
      {/* ════════ HEADER ════════ */}
      <section className="mk-section mk-pt-header" style={{ paddingBottom: '0' }}>
        <div className="mk-container">
          <div className="mk-section__header">
            <h1 className="mk-section__title" style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontStyle: 'italic' }}>
              Simple, Transparent Pricing
            </h1>
            <p className="mk-section__subtitle" style={{ margin: '0 auto 28px' }}>
              Choose the plan that fits your needs.
            </p>

            {/* Toggle */}
            <div className="mk-toggle">
              <button
                className={`mk-toggle__btn ${tab === 'clients' ? 'mk-toggle__btn--active' : ''}`}
                onClick={() => setTab('clients')}
              >
                For Clients
              </button>
              <button
                className={`mk-toggle__btn ${tab === 'writers' ? 'mk-toggle__btn--active' : ''}`}
                onClick={() => setTab('writers')}
              >
                For Writers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PRICING CARDS ════════ */}
      <section className="mk-section" style={{ paddingTop: '32px' }}>
        <div className="mk-container">
          <div className="mk-pricing-grid" style={{
            gridTemplateColumns: tab === 'writers' ? 'repeat(2, 1fr)' : undefined,
            maxWidth: tab === 'writers' ? '700px' : undefined,
            margin: tab === 'writers' ? '0 auto' : undefined,
          }}>
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`mk-pricing-card ${plan.featured ? 'mk-pricing-card--featured' : ''}`}
              >
                {plan.featured && <div className="mk-pricing-card__badge">Most Popular</div>}

                <div className="mk-pricing-card__icon">
                  <plan.icon size={22} />
                </div>

                <div className="mk-pricing-card__name">{plan.name}</div>
                <div className="mk-pricing-card__desc">{plan.desc}</div>

                <div className="mk-pricing-card__price">
                  <span className="mk-pricing-card__amount">{plan.price}</span>
                  {plan.period && <span className="mk-pricing-card__period">{plan.period}</span>}
                </div>

                <ul className="mk-pricing-card__features">
                  {plan.features.map(feat => (
                    <li key={feat} className="mk-pricing-card__feature">
                      <Check size={16} color="var(--mk-primary)" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta === 'Contact Us' ? 'mailto:sales@createforearn.com' : '/signup'}
                  className={`mk-btn mk-btn--full ${plan.featured ? 'mk-btn--primary' : 'mk-btn--outline'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
