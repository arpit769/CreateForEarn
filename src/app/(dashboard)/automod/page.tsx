'use client';

import { useState } from 'react';
import { autoModRules, timeAgo } from '@/data/mockData';
import type { AutoModRule } from '@/data/mockData';

const typeColors: Record<string, string> = {
  spam: 'badge-red',
  content: 'badge-purple',
  user: 'badge-cyan',
  flair: 'badge-orange',
  custom: 'badge-blue',
};

const typeIcons: Record<string, string> = {
  spam: '',
  content: '',
  user: '',
  flair: '',
  custom: '',
};

const actionColors: Record<string, string> = {
  remove: 'badge-red',
  flag: 'badge-orange',
  approve: 'badge-green',
  notify: 'badge-blue',
};

const templates = [
  { name: 'New Account Filter', description: 'Remove posts from accounts less than 24 hours old', type: 'spam', conditions: 'account_age < 1 day', action: 'remove' },
  { name: 'Karma Gate', description: 'Require minimum 50 karma to post', type: 'user', conditions: 'author_karma < 50', action: 'remove' },
  { name: 'URL Whitelist', description: 'Only allow links from approved domains', type: 'content', conditions: 'domain not in [whitelist]', action: 'flag' },
  { name: 'Caps Lock Filter', description: 'Flag posts with titles in all caps', type: 'content', conditions: 'title == uppercase(title)', action: 'flag' },
  { name: 'Repost Detector', description: 'Flag posts with titles matching recent submissions', type: 'content', conditions: 'title_match > 90% within 7d', action: 'flag' },
];

export default function AutoModPage() {
  const [rules, setRules] = useState<AutoModRule[]>(autoModRules);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    type: 'content' as AutoModRule['type'],
    action: 'flag' as AutoModRule['action'],
    conditions: '',
  });

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const addRule = () => {
    if (!newRule.name || !newRule.conditions) return;
    const rule: AutoModRule = {
      id: `am${Date.now()}`,
      name: newRule.name,
      description: newRule.description,
      type: newRule.type,
      action: newRule.action,
      conditions: newRule.conditions,
      enabled: true,
      triggerCount: 0,
      lastTriggered: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRules(prev => [rule, ...prev]);
    setNewRule({ name: '', description: '', type: 'content', action: 'flag', conditions: '' });
    setShowForm(false);
  };

  const loadTemplate = (template: typeof templates[0]) => {
    setNewRule({
      name: template.name,
      description: template.description,
      type: template.type as AutoModRule['type'],
      action: template.action as AutoModRule['action'],
      conditions: template.conditions,
    });
    setShowTemplates(false);
    setShowForm(true);
  };

  const enabledCount = rules.filter(r => r.enabled).length;
  const totalTriggers = rules.reduce((sum, r) => sum + r.triggerCount, 0);

  return (
    <div className="page-enter">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <div className="glass-card-static" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            
          </div>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 800 }}>{enabledCount}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Rules</p>
          </div>
        </div>
        <div className="glass-card-static" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            
          </div>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 800 }}>{totalTriggers.toLocaleString()}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Triggers</p>
          </div>
        </div>
        <div className="glass-card-static" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            
          </div>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 800 }}>{rules.length}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Rules</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setShowTemplates(false); }}>
          {showForm ? ' Cancel' : '+ Create Rule'}
        </button>
        <button className="btn-secondary" onClick={() => { setShowTemplates(!showTemplates); setShowForm(false); }}>
          {showTemplates ? ' Close' : ' Templates'}
        </button>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="glass-card-static" style={{ padding: '24px', marginBottom: '20px', animation: 'scale-in 0.2s ease-out' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}> Rule Templates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {templates.map((template) => (
              <div
                key={template.name}
                style={{
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => loadTemplate(template)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span>{typeIcons[template.type]}</span>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{template.name}</h4>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{template.description}</p>
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                  <span className={`badge ${typeColors[template.type]}`} style={{ fontSize: '10px' }}>{template.type}</span>
                  <span className={`badge ${actionColors[template.action]}`} style={{ fontSize: '10px' }}>{template.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="glass-card-static" style={{ padding: '24px', marginBottom: '20px', animation: 'scale-in 0.2s ease-out' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}> Create AutoMod Rule</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Rule Name *</label>
                <input className="input-field" placeholder="e.g., Spam Filter" value={newRule.name} onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Description</label>
                <input className="input-field" placeholder="What does this rule do?" value={newRule.description} onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Type</label>
                <select className="select-field" value={newRule.type} onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value as AutoModRule['type'] }))}>
                  <option value="spam"> Spam</option>
                  <option value="content"> Content</option>
                  <option value="user"> User</option>
                  <option value="flair"> Flair</option>
                  <option value="custom"> Custom</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Action</label>
                <select className="select-field" value={newRule.action} onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value as AutoModRule['action'] }))}>
                  <option value="remove">Remove</option>
                  <option value="flag">Flag for Review</option>
                  <option value="approve">Auto-Approve</option>
                  <option value="notify">Notify</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Conditions *</label>
              <textarea
                className="textarea-field"
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                placeholder="e.g., account_age < 7 days AND karma < 10"
                value={newRule.conditions}
                onChange={(e) => setNewRule(prev => ({ ...prev, conditions: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={addRule}>Create Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className="glass-card"
            style={{
              padding: '20px',
              opacity: rule.enabled ? 1 : 0.6,
              animation: `slide-up 0.3s ease-out forwards`,
              animationDelay: `${index * 40}ms`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              {/* Toggle */}
              <div
                className={`toggle-switch ${rule.enabled ? 'active' : ''}`}
                onClick={() => toggleRule(rule.id)}
                style={{ marginTop: '2px' }}
              />

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{rule.name}</h4>
                  <span className={`badge ${typeColors[rule.type]}`}>{typeIcons[rule.type]} {rule.type}</span>
                  <span className={`badge ${actionColors[rule.action]}`}>→ {rule.action}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
                  {rule.description}
                </p>

                {/* Conditions */}
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'var(--accent-cyan)',
                  marginBottom: '10px',
                }}>
                  {rule.conditions}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span> {rule.triggerCount} triggers</span>
                  <span> Last: {timeAgo(rule.lastTriggered)}</span>
                  <span> Created: {rule.createdAt}</span>
                </div>
              </div>

              {/* Delete */}
              <button
                className="btn-ghost"
                style={{ color: 'var(--accent-red)', padding: '6px 10px' }}
                onClick={() => deleteRule(rule.id)}
              >
                
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
