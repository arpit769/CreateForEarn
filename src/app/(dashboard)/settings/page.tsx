'use client';

import { useState } from 'react';
import { subredditStats } from '@/data/mockData';

interface SettingsSection {
  id: string;
  title: string;
  icon: string;
}

const sections: SettingsSection[] = [
  { id: 'community', title: 'Community', icon: '' },
  { id: 'moderation', title: 'Moderation', icon: '' },
  { id: 'notifications', title: 'Notifications', icon: '' },
  { id: 'appearance', title: 'Appearance', icon: '' },
  { id: 'api', title: 'API & Integrations', icon: '' },
];

const communityRules = [
  'Be respectful and constructive',
  'No spam or self-promotion without context',
  'Use appropriate flairs for your posts',
  'No NSFW content',
  'Credit original creators',
  'Search before posting',
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('community');
  const [settings, setSettings] = useState({
    communityName: subredditStats.displayName,
    description: subredditStats.description,
    sidebar: 'Welcome to r/TechInnovators! We are a community dedicated to discussing technology, programming, and innovation.',
    rules: communityRules,
    spamFilter: 'high',
    suggestedSort: 'confidence',
    allowImages: true,
    allowPolls: true,
    allowCrosspost: true,
    restrictPosting: false,
    requireFlair: true,
    emailNotifs: true,
    pushNotifs: false,
    modmailNotifs: true,
    reportNotifs: true,
    weeklyDigest: true,
    accentColor: '#ffffff',
    apiKey: '••••••••••••••••••••••••',
    webhookUrl: '',
  });

  const [newRule, setNewRule] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setSettings(prev => ({ ...prev, rules: [...prev.rules, newRule] }));
    setNewRule('');
  };

  const removeRule = (index: number) => {
    setSettings(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  const accentColors = [
    { name: 'Violet', value: '#7c3aed' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
  ];

  return (
    <div className="page-enter">
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px' }}>
        {/* Left — Section Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeSection === section.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: activeSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: activeSection === section.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <span>{section.icon}</span>
              {section.title}
            </button>
          ))}
        </div>

        {/* Right — Settings Content */}
        <div className="glass-card-static" style={{ padding: '28px' }}>
          {/* Community Settings */}
          {activeSection === 'community' && (
            <div style={{ animation: 'fade-in 0.2s ease-out' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}> Community Settings</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Community Name</label>
                  <input className="input-field" value={settings.communityName} onChange={(e) => setSettings(prev => ({ ...prev, communityName: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Description</label>
                  <textarea className="textarea-field" value={settings.description} onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Sidebar Content</label>
                  <textarea className="textarea-field" style={{ minHeight: '120px' }} value={settings.sidebar} onChange={(e) => setSettings(prev => ({ ...prev, sidebar: e.target.value }))} />
                </div>

                {/* Rules */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                    Community Rules ({settings.rules.length})
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {settings.rules.map((rule, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: '8px',
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-purple)', width: '20px' }}>{index + 1}.</span>
                        <span style={{ fontSize: '13px', flex: 1 }}>{rule}</span>
                        <button className="btn-ghost" style={{ padding: '2px 6px', color: 'var(--accent-red)', fontSize: '12px' }} onClick={() => removeRule(index)}></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input-field" placeholder="Add new rule..." value={newRule} onChange={(e) => setNewRule(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRule()} />
                    <button className="btn-secondary" onClick={addRule}>Add</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Moderation Settings */}
          {activeSection === 'moderation' && (
            <div style={{ animation: 'fade-in 0.2s ease-out' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}> Moderation Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Spam Filter Strength</label>
                  <select className="select-field" style={{ maxWidth: '300px' }} value={settings.spamFilter} onChange={(e) => setSettings(prev => ({ ...prev, spamFilter: e.target.value }))}>
                    <option value="low">Low — Only obvious spam</option>
                    <option value="medium">Medium — Most spam caught</option>
                    <option value="high">High — Aggressive filtering</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Default Comment Sort</label>
                  <select className="select-field" style={{ maxWidth: '300px' }} value={settings.suggestedSort} onChange={(e) => setSettings(prev => ({ ...prev, suggestedSort: e.target.value }))}>
                    <option value="confidence">Best</option>
                    <option value="top">Top</option>
                    <option value="new">New</option>
                    <option value="controversial">Controversial</option>
                    <option value="qa">Q&A</option>
                  </select>
                </div>

                {[
                  { key: 'allowImages', label: 'Allow Image Posts', desc: 'Members can submit image posts' },
                  { key: 'allowPolls', label: 'Allow Polls', desc: 'Members can create poll posts' },
                  { key: 'allowCrosspost', label: 'Allow Crossposts', desc: 'Members can crosspost from other subreddits' },
                  { key: 'restrictPosting', label: 'Restrict Posting', desc: 'Only approved users can create posts' },
                  { key: 'requireFlair', label: 'Require Post Flair', desc: 'Posts must have a flair assigned' },
                ].map(toggle => (
                  <div key={toggle.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '10px',
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600 }}>{toggle.label}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{toggle.desc}</p>
                    </div>
                    <div
                      className={`toggle-switch ${settings[toggle.key as keyof typeof settings] ? 'active' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, [toggle.key]: !prev[toggle.key as keyof typeof settings] }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div style={{ animation: 'fade-in 0.2s ease-out' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}> Notification Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'emailNotifs', label: 'Email Notifications', desc: 'Receive email for important updates', icon: '' },
                  { key: 'pushNotifs', label: 'Push Notifications', desc: 'Browser push notifications', icon: '' },
                  { key: 'modmailNotifs', label: 'Modmail Alerts', desc: 'Get notified for new modmail messages', icon: '' },
                  { key: 'reportNotifs', label: 'Report Alerts', desc: 'Instant alerts when content is reported', icon: '' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of community stats', icon: '' },
                ].map(notif => (
                  <div key={notif.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{notif.icon}</span>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>{notif.label}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{notif.desc}</p>
                      </div>
                    </div>
                    <div
                      className={`toggle-switch ${settings[notif.key as keyof typeof settings] ? 'active' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, [notif.key]: !prev[notif.key as keyof typeof settings] }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div style={{ animation: 'fade-in 0.2s ease-out' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}> Appearance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>Accent Color</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {accentColors.map(color => (
                      <div
                        key={color.value}
                        onClick={() => setSettings(prev => ({ ...prev, accentColor: color.value }))}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: color.value,
                          border: settings.accentColor === color.value ? '3px solid white' : '3px solid transparent',
                          transition: 'all 0.2s ease',
                          transform: settings.accentColor === color.value ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: settings.accentColor === color.value ? `0 0 20px ${color.value}60` : 'none',
                        }} />
                        <span style={{ fontSize: '11px', color: settings.accentColor === color.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {color.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '12px',
                  borderLeft: `4px solid ${settings.accentColor}`,
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Preview</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>This is how your accent color will look across the dashboard.</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      background: settings.accentColor,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      Primary Button
                    </button>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: settings.accentColor,
                      background: settings.accentColor + '20',
                      border: `1px solid ${settings.accentColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      Badge
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API & Integrations */}
          {activeSection === 'api' && (
            <div style={{ animation: 'fade-in 0.2s ease-out' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}> API & Integrations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '10px',
                }}>
                  <p style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}> API Configuration</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Connect your Reddit API credentials to enable live data syncing. Currently running with demo data.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Reddit API Key</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input-field" type="password" value={settings.apiKey} onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))} />
                    <button className="btn-secondary">Reveal</button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Webhook URL (Discord/Slack)</label>
                  <input className="input-field" placeholder="https://discord.com/api/webhooks/..." value={settings.webhookUrl} onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))} />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Get notified in your team chat when important events happen.</p>
                </div>

                <div style={{
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Connected Integrations</h4>
                  {[
                    { name: 'Reddit API', status: 'demo', icon: '' },
                    { name: 'Discord Webhook', status: 'not connected', icon: '' },
                    { name: 'Slack Webhook', status: 'not connected', icon: '' },
                  ].map(int => (
                    <div key={int.name} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{int.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{int.name}</span>
                      </div>
                      <span className={`badge ${int.status === 'demo' ? 'badge-orange' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                        {int.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary">Reset</button>
            <button className="btn-primary" onClick={handleSave}>
              {saved ? ' Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
