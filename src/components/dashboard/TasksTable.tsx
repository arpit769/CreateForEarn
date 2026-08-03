'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Image as ImageIcon, Type, Trash2 } from 'lucide-react';
import { createTask } from '@/actions/tasks';
import { createClient } from '@/utils/supabase/client';

export default function TasksTable({ initialTasks, subreddits }: { initialTasks: any[], subreddits: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [subredditId, setSubredditId] = useState('');
  const [newSubredditName, setNewSubredditName] = useState('');
  const [flair, setFlair] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // New States for Task Categories
  const [mainCategory, setMainCategory] = useState<'post' | 'comment'>('post');
  const [taskType, setTaskType] = useState('text'); // For post: text or image
  const [contentSource, setContentSource] = useState<'provided' | 'custom'>('provided'); // Admin vs User
  const [postLink, setPostLink] = useState('');
  const [slots, setSlots] = useState('10');
  
  const [paymentType, setPaymentType] = useState('base'); // base or custom
  const [customPayment, setCustomPayment] = useState('0.20');

  // Handle Category Switch
  const handleCategoryChange = (cat: 'post' | 'comment') => {
    setMainCategory(cat);
    if (cat === 'post') {
      setCustomPayment(contentSource === 'provided' ? '0.20' : '0.25');
      setPaymentType('base');
    } else {
      setCustomPayment(contentSource === 'provided' ? '0.05' : '0.10');
      setPaymentType('base');
    }
  };

  const handleContentSourceChange = (source: 'provided' | 'custom') => {
    setContentSource(source);
    if (mainCategory === 'post') {
      setCustomPayment(source === 'provided' ? '0.20' : '0.25');
    } else {
      setCustomPayment(source === 'provided' ? '0.05' : '0.10');
    }
    setPaymentType('base');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    
    if (subredditId === 'open_for_all') {
      formData.append('subreddit_id', 'open_for_all');
    } else {
      formData.append('subreddit_id', subredditId);
    }

    if (subredditId === 'new_custom' && newSubredditName) {
      formData.append('new_subreddit_name', newSubredditName);
    }
    formData.append('flair', flair);
    formData.append('title', title);
    if (body) formData.append('content_body', body);
    
    if (mainCategory === 'post') {
      if (contentSource === 'provided') {
        if (imageFile) {
          const supabase = createClient();
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('task_images')
            .upload(filePath, imageFile);
            
          if (uploadError) {
            alert('Error uploading image: ' + uploadError.message);
            setIsSubmitting(false);
            return;
          }
          
          const { data } = supabase.storage.from('task_images').getPublicUrl(filePath);
          formData.append('image_url', data.publicUrl);
        } else if (imageUrl) {
          formData.append('image_url', imageUrl);
        }
      }
      formData.append('content_mode', taskType); // 'text' or 'image' (we ignore contentSource for DB content_mode since it expects text/image)
      formData.append('task_type', 'post');
      formData.append('max_claims', contentSource === 'provided' ? '1' : slots);
    } else {
      formData.append('post_link', postLink);
      formData.append('content_mode', contentSource); // 'provided' or 'custom' (since this is what we used before and it was accepted, or we just rely on no constraint)
      formData.append('task_type', 'comment');
      formData.append('max_claims', contentSource === 'provided' ? '1' : slots);
    }
    
    let baseAmt = mainCategory === 'post' 
      ? (contentSource === 'provided' ? 0.20 : 0.25) 
      : (contentSource === 'provided' ? 0.05 : 0.10);
      
    const finalAmount = paymentType === 'base' ? baseAmt : parseFloat(customPayment);
    formData.append('payment_amount', finalAmount.toString());

    // Defaults for now
    formData.append('instructions', mainCategory === 'post' ? 'Please create a post with the provided details.' : 'Please comment on the provided post link.');
    
    const res = await createTask(formData);
    
    if (res.error) {
      alert("Error: " + res.error);
    } else {
      setIsModalOpen(false);
      // We will just refresh the page for now
      window.location.reload();
    }
    
    setIsSubmitting(false);
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Manage Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Create and manage tasks for workers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} /> Create Task
        </button>
      </div>

      <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--hero-glow-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ borderTopLeftRadius: '16px', padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subreddit</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
              <th style={{ borderTopRightRadius: '16px', padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks found. Create one above!</td>
              </tr>
            ) : tasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</p>
                  {t.flair && <span style={{ display: 'inline-block', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '12px', marginTop: '4px' }}>{t.flair}</span>}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                  {t.subreddit_id === null ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>🌐 Open for All</span>
                  ) : (
                    `r/${t.subreddits?.name || 'Unknown'}`
                  )}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 600 }}>${t.payment_amount?.toFixed(2)}</td>
                <td style={{ padding: '16px 24px' }}>
                  {t.task_type === 'text' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}><Type size={16} /> Text</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}><ImageIcon size={16} /> Image</span>
                  )}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toISOString().split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'relative', margin: 'auto', width: '100%', maxWidth: '600px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>Create New Task</h2>
              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Subreddit *</label>
                  <select required value={subredditId} onChange={e => setSubredditId(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                    <option value="">Select Subreddit</option>
                    <option value="open_for_all">🌐 Open for All</option>
                    {subreddits.map(s => <option key={s.id} value={s.id}>r/{s.name}</option>)}
                    <option value="new_custom">+ Create New Subreddit</option>
                  </select>
                  {subredditId === 'new_custom' && (
                    <input 
                      required 
                      type="text" 
                      value={newSubredditName} 
                      onChange={e => setNewSubredditName(e.target.value)} 
                      placeholder="Enter new subreddit name (without r/)" 
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '8px' }} 
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Task Category *</label>
                  <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input type="radio" name="main_category" checked={mainCategory === 'post'} onChange={() => handleCategoryChange('post')} /> Post
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input type="radio" name="main_category" checked={mainCategory === 'comment'} onChange={() => handleCategoryChange('comment')} /> Comment
                    </label>
                  </div>
                </div>

                {mainCategory === 'post' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Post Type *</label>
                    <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <input type="radio" name="task_type" checked={taskType === 'text'} onChange={() => setTaskType('text')} /> Text Post
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <input type="radio" name="task_type" checked={taskType === 'image'} onChange={() => setTaskType('image')} /> Image Post
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Content Source *</label>
                  <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input type="radio" name="content_source" checked={contentSource === 'provided'} onChange={() => handleContentSourceChange('provided')} /> Admin Provided Content
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input type="radio" name="content_source" checked={contentSource === 'custom'} onChange={() => handleContentSourceChange('custom')} /> User Generated Content
                    </label>
                  </div>
                </div>

                {mainCategory === 'comment' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Post Link *</label>
                    <input required type="url" value={postLink} onChange={e => setPostLink(e.target.value)} placeholder="Link to the reddit post" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Task Title *</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Compulsory" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                </div>

                {mainCategory === 'post' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Flair (Optional)</label>
                    <input type="text" value={flair} onChange={e => setFlair(e.target.value)} placeholder="e.g. Discussion" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                {((mainCategory === 'post' && taskType === 'text') || (mainCategory === 'comment')) && contentSource === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{mainCategory === 'post' ? 'Post Body *' : 'Comment Content *'}</label>
                    <textarea required value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder={mainCategory === 'post' ? "What exactly should they post?" : "Exact comment to post"} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }} />
                  </div>
                )}

                {(mainCategory === 'post' && taskType === 'image' && contentSource === 'provided') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Image File or URL * (Provide at least one)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => e.target.files && setImageFile(e.target.files[0])} 
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                      />
                      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>OR</div>
                      <input 
                        type="url" 
                        value={imageUrl} 
                        onChange={e => setImageUrl(e.target.value)} 
                        placeholder="Link to the image to post (Optional if file provided)" 
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                      />
                    </div>
                  </div>
                )}

                {contentSource === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Number of Slots (Workers) *</label>
                    <input required type="number" min="1" value={slots} onChange={e => setSlots(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Payment Amount</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input type="radio" checked={paymentType === 'base'} onChange={() => setPaymentType('base')} /> 
                      Base Amount (${mainCategory === 'post' ? (contentSource === 'provided' ? '0.20' : '0.25') : (contentSource === 'provided' ? '0.05' : '0.10')})
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input type="radio" checked={paymentType === 'custom'} onChange={() => setPaymentType('custom')} /> 
                      Custom Amount
                    </label>
                    {paymentType === 'custom' && (
                      <input type="number" step="0.01" min="0" value={customPayment} onChange={e => setCustomPayment(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '4px' }} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '12px', justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting || !title || !subredditId} className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', justifyContent: 'center', opacity: (isSubmitting || !title || !subredditId) ? 0.5 : 1 }}>{isSubmitting ? 'Creating...' : 'Create Task'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
