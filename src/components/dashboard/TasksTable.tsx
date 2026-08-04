'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Image as ImageIcon, Type, Trash2, UploadCloud, Link2, X, Check, FileImage } from 'lucide-react';
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // New States for Task Categories
  const [mainCategory, setMainCategory] = useState<'post' | 'comment'>('post');
  const [taskType, setTaskType] = useState('text'); // For post: text or image
  const [contentSource, setContentSource] = useState<'provided' | 'custom'>('provided'); // Admin vs User
  const [postLink, setPostLink] = useState('');
  const [slots, setSlots] = useState('10');
  
  const [paymentType, setPaymentType] = useState('base'); // base or custom
  const [customPayment, setCustomPayment] = useState('0.20');

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setSubredditId('');
    setNewSubredditName('');
    setFlair('');
    setTitle('');
    setBody('');
    setImageUrl('');
    handleRemoveFile();
    setImageInputMode('upload');
    setMainCategory('post');
    setTaskType('text');
    setContentSource('provided');
    setPostLink('');
    setSlots('10');
    setPaymentType('base');
    setCustomPayment('0.20');
  };

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

    // Validate compulsory fields with explicit alerts
    if (!subredditId) {
      alert('Please fill all the details first: Please select a target subreddit.');
      return;
    }

    if (subredditId === 'new_custom' && !newSubredditName.trim()) {
      alert('Please fill all the details first: Please enter the new subreddit name.');
      return;
    }

    let finalTitle = title.trim();
    if (contentSource === 'provided') {
      if (!finalTitle) {
        alert('Please fill all the details first: Task title is compulsory.');
        return;
      }
    } else {
      finalTitle = mainCategory === 'post' 
        ? (taskType === 'image' ? 'User-Generated Image Post' : 'User-Generated Text Post')
        : 'User-Generated Comment';
    }

    if (mainCategory === 'comment' && !postLink.trim()) {
      alert('Please fill all the details first: Target Reddit post link is required.');
      return;
    }

    if (((mainCategory === 'post' && taskType === 'text') || mainCategory === 'comment') && contentSource === 'provided' && !body.trim()) {
      alert(`Please fill all the details first: ${mainCategory === 'post' ? 'Post body' : 'Comment content'} is compulsory.`);
      return;
    }

    if (mainCategory === 'post' && taskType === 'image' && contentSource === 'provided') {
      if (imageInputMode === 'upload' && !imageFile) {
        alert('Please fill all the details first: Please choose an image file to upload.');
        return;
      }
      if (imageInputMode === 'url' && !imageUrl.trim()) {
        alert('Please fill all the details first: Please enter an image URL.');
        return;
      }
    }

    if (contentSource === 'custom' && (!slots || parseInt(slots) <= 0)) {
      alert('Please fill all the details first: Number of slots must be at least 1.');
      return;
    }

    if (paymentType === 'custom' && (!customPayment || parseFloat(customPayment) <= 0)) {
      alert('Please fill all the details first: Please enter a valid payment amount.');
      return;
    }

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
    formData.append('flair', contentSource === 'provided' ? flair : '');
    formData.append('title', finalTitle);
    if (body && contentSource === 'provided') formData.append('content_body', body.trim());
    
    if (mainCategory === 'post') {
      if (contentSource === 'provided' && taskType === 'image') {
        if (imageInputMode === 'upload' && imageFile) {
          const supabase = createClient();
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
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
        } else if (imageInputMode === 'url' && imageUrl) {
          formData.append('image_url', imageUrl.trim());
        }
      }
      formData.append('content_mode', taskType); // 'text' or 'image' (we ignore contentSource for DB content_mode since it expects text/image)
      formData.append('task_type', 'post');
      formData.append('max_claims', contentSource === 'provided' ? '1' : slots);
    } else {
      formData.append('post_link', postLink.trim());
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
      resetForm();
      setIsModalOpen(false);
      // We will just refresh the page for now
      window.location.reload();
    }
    
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Manage Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Create and manage tasks for workers.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Create Task
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="admin-desktop-table" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--hero-glow-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ borderTopLeftRadius: '16px', padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subreddit</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Slots</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
              <th style={{ borderTopRightRadius: '16px', padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks found. Create one above!</td>
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
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '4px', 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: (t.active_claims_count || 0) >= (t.max_claims || 1) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                    color: (t.active_claims_count || 0) >= (t.max_claims || 1) ? '#ef4444' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    👥 {t.active_claims_count || 0} / {t.max_claims || 1}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 600 }}>${t.payment_amount?.toFixed(2)}</td>
                <td style={{ padding: '16px 24px' }}>
                  {t.task_type === 'text' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}><Type size={16} /> Text</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}><ImageIcon size={16} /> Image</span>
                  )}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="admin-mobile-cards">
        {tasks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            No tasks found. Create one above!
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="admin-card-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</h3>
                  {t.flair && (
                    <span style={{ display: 'inline-block', padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '11px', marginTop: '4px' }}>
                      {t.flair}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
                  ${t.payment_amount?.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>
                    {t.subreddit_id === null ? '🌐 Open for All' : `r/${t.subreddits?.name || 'Unknown'}`}
                  </span>
                  <span>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    👥 {t.active_claims_count || 0}/{t.max_claims || 1} slots
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t.task_type === 'text' ? <Type size={13} /> : <ImageIcon size={13} />}
                    {t.task_type === 'text' ? 'Text' : 'Image'}
                  </span>
                  <span>•</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '12px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="admin-modal-box" style={{ maxWidth: '560px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Create New Task</h2>
                <button onClick={() => { resetForm(); setIsModalOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>

              <form onSubmit={handleCreateTask} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Subreddit *</label>
                  <select 
                    required 
                    value={subredditId} 
                    onChange={e => setSubredditId(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  >
                    <option value="" disabled>Select a subreddit</option>
                    <option value="open_for_all" style={{ fontWeight: 'bold' }}>🌐 Open for All (Any Subreddit)</option>
                    {subreddits.map(s => (
                      <option key={s.id} value={s.id}>r/{s.name} ({s.min_karma_required} karma req.)</option>
                    ))}
                    <option value="new_custom">+ Add New Subreddit</option>
                  </select>
                </div>

                {subredditId === 'new_custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>New Subreddit Name *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. technology (without r/)" 
                      value={newSubredditName} 
                      onChange={e => setNewSubredditName(e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}

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

                {contentSource === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Task Title *</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Compulsory" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                {mainCategory === 'post' && contentSource === 'provided' && (
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
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Post Image *
                    </label>

                    {/* Mode Selector Toggle */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: imageInputMode === 'upload' ? 'var(--accent-blue)' : 'transparent',
                          color: imageInputMode === 'upload' ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <UploadCloud size={15} /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: imageInputMode === 'url' ? 'var(--accent-blue)' : 'transparent',
                          color: imageInputMode === 'url' ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Link2 size={15} /> Image URL
                      </button>
                    </div>

                    {imageInputMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelect(e.target.files[0]);
                            }
                          }}
                        />

                        {!imageFile ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleFileSelect(e.dataTransfer.files[0]);
                              }
                            }}
                            style={{
                              border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border-medium)'}`,
                              borderRadius: '12px',
                              padding: '24px 16px',
                              textAlign: 'center',
                              background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-elevated)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '2px'
                            }}>
                              <UploadCloud size={22} />
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                Click to browse or drag & drop image
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Supports PNG, JPG, WEBP, GIF (Max 10MB)
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '12px'
                          }}>
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Selected preview"
                                style={{
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border-subtle)',
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <FileImage size={24} color="var(--text-muted)" />
                              </div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: '2px'
                              }}>
                                {imageFile.name}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {(imageFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-medium)',
                                  background: 'transparent',
                                  color: 'var(--text-secondary)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Remove image"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{ position: 'relative' }}>
                          <Link2 size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            style={{
                              width: '100%',
                              padding: '12px 14px 12px 40px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        {imageUrl && (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={imageUrl}
                              alt="URL preview"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '6px',
                                objectFit: 'cover',
                                border: '1px solid var(--border-subtle)'
                              }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Image Link Preview</span>
                          </div>
                        )}
                      </div>
                    )}
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
                  <button type="button" onClick={() => { resetForm(); setIsModalOpen(false); }} className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '12px', justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Creating...' : 'Create Task'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
