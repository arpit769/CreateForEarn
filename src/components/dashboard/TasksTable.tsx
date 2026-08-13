'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Image as ImageIcon, Type, Trash2, UploadCloud, Link2, X, Check, FileImage, Pencil, MessageSquare, Calendar, ArrowBigUp, Share2, ExternalLink, Copy, Sparkles } from 'lucide-react';
import { createTask, updateTask, deleteTask, getTaskClaimsByAdmin } from '@/actions/tasks';
import { createClient } from '@/utils/supabase/client';
import { useSearchParams } from 'next/navigation';
import { getRedditUsername } from '@/utils/reddit';

export default function TasksTable({ initialTasks, subreddits, taskCategory = 'standard' }: { initialTasks: any[], subreddits: any[], taskCategory?: 'standard' | 'karma_farm' }) {
  const [tasks, setTasks] = useState(initialTasks.filter(t => taskCategory === 'standard' ? t.task_category !== 'karma_farm' : t.task_category === 'karma_farm'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Claims Modal State
  const [viewingClaimsTaskId, setViewingClaimsTaskId] = useState<string | null>(null);
  const [taskClaims, setTaskClaims] = useState<any[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);

  const handleViewClaims = async (taskId: string) => {
    setViewingClaimsTaskId(taskId);
    setIsLoadingClaims(true);
    const res = await getTaskClaimsByAdmin(taskId);
    if (res.claims) {
      setTaskClaims(res.claims);
    }
    setIsLoadingClaims(false);
  };

  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const displayedTasks = tasks.filter(t => {
    const isCompleted = (t.active_claims_count || 0) >= (t.max_claims || 1);
    return activeTab === 'completed' ? isCompleted : !isCompleted;
  });

  const filteredTasks = displayedTasks.filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.instructions || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.subreddits?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.task_seq_id && `task id: ${t.task_seq_id}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.task_seq_id && String(t.task_seq_id).includes(searchQuery.toLowerCase()))
  );
  
  // Calculate aggregate stats
  const totalApprovedTasks = tasks.reduce((sum, t) => sum + (t.approved_claims_count || 0), 0);
  const totalBaseMoneyGiven = tasks.reduce((sum, t) => sum + ((t.approved_claims_count || 0) * (Number(t.payment_amount) || 0)), 0);
  const totalBonusGiven = tasks.reduce((sum, t) => sum + (t.total_bonus_amount || 0), 0);
  const totalMoneyGiven = totalBaseMoneyGiven + totalBonusGiven;

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
  
  // States for Task Categories
  const [mainCategory, setMainCategory] = useState<'post' | 'comment' | 'upvote' | 'crosspost' | 'karma_farm'>('post');
  const [karmaFarmType, setKarmaFarmType] = useState<'post' | 'comment'>('post');
  const [taskType, setTaskType] = useState('text'); // For post: text or image
  const [contentSource, setContentSource] = useState<'provided' | 'custom'>('provided'); // Admin vs User
  const [postLink, setPostLink] = useState('');
  const [crosspostSubLink, setCrosspostSubLink] = useState('');
  const [slots, setSlots] = useState('10');
  const [instructions, setInstructions] = useState('');
  
  const [paymentType, setPaymentType] = useState('base'); // base or custom
  const [customPayment, setCustomPayment] = useState('0.20');

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCrosspostLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setSubredditId('');
    setNewSubredditName('');
    setFlair('');
    setTitle('');
    setBody('');
    setInstructions('');
    setImageUrl('');
    handleRemoveFile();
    setImageInputMode('upload');
    setMainCategory(taskCategory === 'karma_farm' ? 'karma_farm' : 'post');
    setKarmaFarmType('post');
    setTaskType('text');
    setContentSource('provided');
    setPostLink('');
    setCrosspostSubLink('');
    setSlots('10');
    setPaymentType('base');
    setCustomPayment('0.20');
    setIsScheduled(false);
    setScheduledFor('');
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setSubredditId(task.subreddit_id || 'open_for_all');
    setNewSubredditName('');
    setFlair(task.flair || '');
    setTitle(task.title || '');
    setBody(task.content_body || '');
    setInstructions(task.instructions || '');
    setImageUrl(task.image_url || '');
    setImagePreview(task.image_url || null);
    setImageFile(null);
    setImageInputMode(task.image_url ? 'url' : 'upload');

    if (task.task_category === 'karma_farm') {
      setMainCategory('karma_farm');
      setKarmaFarmType(task.task_type === 'comment' ? 'comment' : 'post');
      setCrosspostSubLink('');
    } else if (task.task_type === 'upvote') {
      setMainCategory('upvote');
      setCrosspostSubLink('');
    } else if (task.task_type === 'crosspost') {
      setMainCategory('crosspost');
      setCrosspostSubLink(task.content_body || (task.subreddits?.name ? `https://www.reddit.com/r/${task.subreddits.name}` : 'https://www.reddit.com'));
    } else if (task.task_type === 'comment') {
      setMainCategory('comment');
      setCrosspostSubLink('');
    } else {
      setMainCategory('post');
      setCrosspostSubLink('');
    }

    setTaskType(task.content_mode === 'image' || task.image_url ? 'image' : 'text');
    setContentSource(task.title?.startsWith('User-Generated') ? 'custom' : 'provided');
    setPostLink(task.post_link || '');
    setSlots(`${task.max_claims || 1}`);
    setPaymentType('custom');
    setCustomPayment(`${task.payment_amount || 0.20}`);
    if (task.scheduled_for) {
      setIsScheduled(true);
      // Convert ISO to local datetime-local format
      const d = new Date(task.scheduled_for);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setScheduledFor(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setIsScheduled(false);
      setScheduledFor('');
    }
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This will permanently delete the task and its claim records.')) return;
    
    setDeletingId(taskId);
    const res = await deleteTask(taskId);
    if (res?.error) {
      alert('Failed to delete task: ' + res.error);
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      alert('Task deleted successfully.');
    }
    setDeletingId(null);
  };

  // Handle Category Switch
  const handleCategoryChange = (cat: 'post' | 'comment' | 'upvote' | 'crosspost' | 'karma_farm') => {
    setMainCategory(cat);
    if (cat === 'post') {
      setCustomPayment(contentSource === 'provided' ? '0.20' : '0.25');
      setPaymentType('base');
      if (!title || title === 'Upvote Reddit Post' || title === 'Crosspost Reddit Post' || title === 'Comment on Reddit Post') {
        setTitle('');
      }
    } else if (cat === 'comment') {
      setCustomPayment(contentSource === 'provided' ? '0.05' : '0.10');
      setPaymentType('base');
      if (!title || title === 'Upvote Reddit Post' || title === 'Crosspost Reddit Post') {
        setTitle('Comment on Reddit Post');
      }
    } else if (cat === 'upvote') {
      setCustomPayment('0.05');
      setPaymentType('base');
      setContentSource('provided');
      if (!title || title === 'Comment on Reddit Post' || title === 'Crosspost Reddit Post') {
        setTitle('Upvote Reddit Post');
      }
      if (!instructions) {
        setInstructions('Open the Reddit post link, upvote the post, and submit your Reddit profile URL or screenshot as proof.');
      }
    } else if (cat === 'crosspost') {
      setCustomPayment('0.20');
      setPaymentType('base');
      setContentSource('provided');
      if (!title || title === 'Comment on Reddit Post' || title === 'Upvote Reddit Post') {
        setTitle('Crosspost Reddit Post');
      }
      if (!instructions) {
        setInstructions('Open the Reddit post link, crosspost it to a relevant subreddit, and submit the link of your crosspost.');
      }
      if (!crosspostSubLink && subredditId) {
        if (subredditId === 'open_for_all') {
          setCrosspostSubLink('https://www.reddit.com');
        } else if (subredditId === 'new_custom') {
          if (newSubredditName.trim()) {
            setCrosspostSubLink(`https://www.reddit.com/r/${newSubredditName.trim()}`);
          }
        } else {
          const found = subreddits.find(s => s.id === subredditId);
          if (found) {
            setCrosspostSubLink(`https://www.reddit.com/r/${found.name}`);
          }
        }
      }
    } else if (cat === 'karma_farm') {
      setCustomPayment('0.00');
      setPaymentType('custom');
      setContentSource('provided');
      if (!title || title === 'Comment on Reddit Post' || title === 'Upvote Reddit Post' || title === 'Crosspost Reddit Post') {
        setTitle('Karma Farm Task');
      }
      if (!instructions) {
        setInstructions('Please complete this unpaid task to grow your karma.');
      }
    }
  };

  const handleContentSourceChange = (source: 'provided' | 'custom') => {
    setContentSource(source);
    if (mainCategory === 'post') {
      setCustomPayment(source === 'provided' ? '0.20' : '0.25');
    } else if (mainCategory === 'comment') {
      setCustomPayment(source === 'provided' ? '0.05' : '0.10');
    }
    setPaymentType('base');
  };

  const handleSubredditChange = (val: string) => {
    setSubredditId(val);
    if (mainCategory === 'post' && (!postLink || postLink.startsWith('https://www.reddit.com/r/'))) {
      if (val === 'open_for_all') {
        setPostLink('https://www.reddit.com');
      } else if (val === 'new_custom' || !val) {
        if (newSubredditName.trim()) {
          setPostLink(`https://www.reddit.com/r/${newSubredditName.trim()}`);
        }
      } else {
        const found = subreddits.find(s => s.id === val);
        if (found) {
          setPostLink(`https://www.reddit.com/r/${found.name}`);
        }
      }
    }
    if (mainCategory === 'crosspost' && (!crosspostSubLink || crosspostSubLink.startsWith('https://www.reddit.com'))) {
      if (val === 'open_for_all') {
        setCrosspostSubLink('https://www.reddit.com');
      } else if (val === 'new_custom' || !val) {
        if (newSubredditName.trim()) {
          setCrosspostSubLink(`https://www.reddit.com/r/${newSubredditName.trim()}`);
        }
      } else {
        const found = subreddits.find(s => s.id === val);
        if (found) {
          setCrosspostSubLink(`https://www.reddit.com/r/${found.name}`);
        }
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subredditId) {
      alert('Please fill all the details first: Please select a Target Subreddit.');
      return;
    }

    if (subredditId === 'new_custom' && !newSubredditName.trim()) {
      alert('Please fill all the details first: Please enter the new subreddit name.');
      return;
    }

    let finalTitle = title.trim();
    if (mainCategory === 'upvote') {
      finalTitle = 'Upvote Reddit Post';
      if (!postLink.trim()) {
        alert('Please fill all the details first: Target Reddit post link is required.');
        return;
      }
      if (!slots || parseInt(slots) <= 0) {
        alert('Please fill all the details first: Number of slots must be at least 1.');
        return;
      }
    } else if (mainCategory === 'crosspost') {
      finalTitle = 'Crosspost Reddit Post';
      if (!postLink.trim()) {
        alert('Please fill all the details first: Original Reddit post link to crosspost is required.');
        return;
      }
      if (!crosspostSubLink.trim()) {
        alert('Please fill all the details first: Crosspost subreddit link is required.');
        return;
      }
    } else if (mainCategory === 'karma_farm') {
      finalTitle = finalTitle || 'Karma Farm Task';
    } else if (contentSource === 'provided') {
      if (mainCategory === 'post') {
        if (!finalTitle) {
          alert('Please fill all the details first: Post title is compulsory.');
          return;
        }
      } else {
        finalTitle = finalTitle || 'Comment on Reddit Post';
      }
    } else {
      finalTitle = mainCategory === 'post' 
        ? (taskType === 'image' ? 'User-Generated Image Post' : 'User-Generated Text Post')
        : 'User-Generated Comment';
    }

    if (mainCategory !== 'upvote' && mainCategory !== 'crosspost' && mainCategory !== 'karma_farm' && !postLink.trim()) {
      alert(`Please fill all the details first: ${mainCategory === 'post' ? 'Subreddit link' : 'Target Reddit post link'} is required.`);
      return;
    }

    if (mainCategory === 'karma_farm' && karmaFarmType === 'comment' && !postLink.trim()) {
      alert('Please fill all the details first: Target Reddit post link is required.');
      return;
    }

    if ((mainCategory === 'comment' || (mainCategory === 'karma_farm' && karmaFarmType === 'comment')) && contentSource === 'provided' && !body.trim()) {
      alert('Please fill all the details first: Comment content is compulsory.');
      return;
    }

    if ((mainCategory === 'post' || (mainCategory === 'karma_farm' && karmaFarmType === 'post')) && taskType === 'image' && contentSource === 'provided') {
      if (imageInputMode === 'upload' && !imageFile && !imageUrl) {
        alert('Please fill all the details first: Please choose an image file to upload.');
        return;
      }
      if (imageInputMode === 'url' && !imageUrl.trim()) {
        alert('Please fill all the details first: Please enter an image URL.');
        return;
      }
    }

    if ((contentSource === 'custom' || mainCategory === 'upvote') && (!slots || parseInt(slots) <= 0)) {
      alert('Please fill all the details first: Number of slots must be at least 1.');
      return;
    }

    if (paymentType === 'custom' && mainCategory !== 'karma_farm' && (!customPayment || parseFloat(customPayment) <= 0)) {
      alert('Please fill all the details first: Please enter a valid payment amount.');
      return;
    }

    if (isScheduled && !scheduledFor) {
      alert('Please select a scheduled date and time.');
      return;
    }

    if (isScheduled && new Date(scheduledFor) <= new Date()) {
      alert('Scheduled date and time must be in the future.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('subreddit_id', subredditId);
    if (subredditId === 'new_custom') {
      formData.append('new_subreddit_name', newSubredditName.trim());
    }
    formData.append('title', finalTitle);
    formData.append('post_link', postLink.trim());
    if (flair && mainCategory === 'post') formData.append('flair', flair.trim());
    if (body && (mainCategory === 'post' || mainCategory === 'comment' || mainCategory === 'karma_farm') && contentSource === 'provided') {
      formData.append('content_body', body.trim());
    }
    
    formData.append('task_category', mainCategory === 'karma_farm' ? 'karma_farm' : 'standard');

    if (mainCategory === 'upvote') {
      formData.append('content_mode', 'provided');
      formData.append('task_type', 'upvote');
      formData.append('max_claims', slots);
      formData.append('instructions', 'Open the Reddit post link, upvote the post, and submit your Reddit profile URL or screenshot as proof.');
    } else if (mainCategory === 'crosspost') {
      formData.append('content_mode', 'provided');
      formData.append('task_type', 'crosspost');
      formData.append('max_claims', '1');
      formData.append('instructions', 'Open the Reddit post link, crosspost it to a relevant subreddit, and submit the link of your crosspost.');
      formData.append('content_body', crosspostSubLink.trim());
    } else if (mainCategory === 'post') {
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
        } else if (imageUrl) {
          formData.append('image_url', imageUrl.trim());
        }
      }
      formData.append('content_mode', taskType);
      formData.append('task_type', 'post');
      formData.append('max_claims', contentSource === 'provided' ? '1' : slots);
      formData.append('instructions', instructions.trim() || 'Please create a post with the provided details.');
    } else if (mainCategory === 'karma_farm') {
      if (karmaFarmType === 'post' && taskType === 'image') {
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
        } else if (imageUrl) {
          formData.append('image_url', imageUrl.trim());
        }
      }
      formData.append('content_mode', karmaFarmType === 'post' ? taskType : 'provided');
      formData.append('task_type', karmaFarmType);
      formData.append('max_claims', '1');
      formData.append('instructions', instructions.trim() || 'Please complete this unpaid task to grow your karma.');
    } else {
      formData.append('content_mode', contentSource);
      formData.append('task_type', 'comment');
      formData.append('max_claims', contentSource === 'provided' ? '1' : slots);
      formData.append('instructions', instructions.trim() || 'Please comment on the provided post link.');
    }
    
    let baseAmt = 0.20;
    if (mainCategory === 'upvote') {
      baseAmt = 0.05;
    } else if (mainCategory === 'crosspost') {
      baseAmt = 0.20;
    } else if (mainCategory === 'comment') {
      baseAmt = contentSource === 'provided' ? 0.05 : 0.10;
    } else {
      baseAmt = contentSource === 'provided' ? 0.20 : 0.25;
    }
      
    let finalAmount = paymentType === 'base' ? baseAmt : parseFloat(customPayment);
    if (mainCategory === 'karma_farm') {
      finalAmount = 0;
    }
    formData.append('payment_amount', finalAmount.toString());

    // Scheduling
    if (isScheduled && scheduledFor) {
      formData.append('scheduled_for', new Date(scheduledFor).toISOString());
    }
    
    let res;
    if (editingTaskId) {
      res = await updateTask(editingTaskId, formData);
    } else {
      res = await createTask(formData);
    }
    
    if (res.error) {
      alert("Error: " + res.error);
    } else {
      alert(editingTaskId ? 'Task updated successfully!' : 'Task created successfully!');
      resetForm();
      setIsModalOpen(false);
      window.location.reload();
    }
    
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {taskCategory === 'karma_farm' ? 'Karma Farm Tasks' : 'Manage Tasks'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {taskCategory === 'karma_farm' ? 'Create and manage karma farm tasks for workers.' : 'Create and manage tasks for workers.'}
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Create Task
        </button>
      </div>

      {/* Aggregate Stats Row */}
      {taskCategory !== 'karma_farm' && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Approved Tasks</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{totalApprovedTasks}</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Check size={20} />
            </div>
          </div>
          <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Money Given</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${totalMoneyGiven.toFixed(2)}</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <span style={{ fontSize: '18px', fontWeight: 700 }}>$</span>
            </div>
          </div>
          <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Base Amount Given</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${totalBaseMoneyGiven.toFixed(2)}</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
              <span style={{ fontSize: '18px', fontWeight: 700 }}>$</span>
            </div>
          </div>
          <div style={{ flex: '1 1 200px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bonus Amount Given</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>${totalBonusGiven.toFixed(2)}</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
              <Sparkles size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'active' ? 'var(--hero-glow-2)' : 'transparent',
              color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'completed' ? 'var(--hero-glow-2)' : 'transparent',
              color: activeTab === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Completed
          </button>
        </div>

        {/* Search Input Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search tasks or subreddits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px', 
              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', 
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' 
            }}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="admin-desktop-table" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
          <thead>
            <tr style={{ background: 'var(--hero-glow-2)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ borderTopLeftRadius: '16px', padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ID</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Subreddit</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Slots</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Payment</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Type</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Date</th>
              <th style={{ borderTopRightRadius: '16px', padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks found matching your search.</td>
              </tr>
            ) : filteredTasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                  {t.task_seq_id && t.task_category !== 'karma_farm' && !t.title?.startsWith('User-Generated') ? `${t.task_seq_id}` : '—'}
                </td>
                <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.3' }}>{t.title}</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                    {t.flair && <span style={{ display: 'inline-block', padding: '1px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '11px' }}>{t.flair}</span>}
                    {t.task_category === 'karma_farm' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}><Sparkles size={10} /> Karma Farm</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                  {t.post_link || t.subreddits?.name ? (
                    <a 
                      href={t.post_link || `https://www.reddit.com/r/${t.subreddits?.name}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '13px' }}
                    >
                      {t.subreddit_id === null ? '🌐 Open for All' : `r/${t.subreddits?.name || 'Unknown'}`} ↗
                    </a>
                  ) : t.subreddit_id === null ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 7px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>🌐 Open for All</span>
                  ) : (
                    `r/${t.subreddits?.name || 'Unknown'}`
                  )}
                </td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '4px', 
                    padding: '3px 8px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                    background: (t.active_claims_count || 0) >= (t.max_claims || 1) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                    color: (t.active_claims_count || 0) >= (t.max_claims || 1) ? '#ef4444' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap'
                  }}>
                    👥 {t.active_claims_count || 0}/{t.max_claims || 1}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '13px' }}>${t.payment_amount?.toFixed(2)}</td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {t.task_type === 'comment' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#3b82f6', fontSize: '12px', fontWeight: 600 }}><MessageSquare size={14} /> Comment</span>
                    ) : t.task_type === 'upvote' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#f97316', fontSize: '12px', fontWeight: 600 }}><ArrowBigUp size={14} /> Upvote</span>
                    ) : t.task_type === 'crosspost' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#a855f7', fontSize: '12px', fontWeight: 600 }}><Share2 size={14} /> Crosspost</span>
                    ) : (t.content_mode === 'image' || Boolean(t.image_url)) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}><ImageIcon size={14} /> Image</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#8b5cf6', fontSize: '12px', fontWeight: 600 }}><Type size={14} /> Text</span>
                    )}
                    <span style={{ 
                      fontSize: '11px', fontWeight: 600,
                      color: t.title?.startsWith('User-Generated') ? 'var(--accent-blue)' : 'var(--text-secondary)'
                    }}>
                      {t.title?.startsWith('User-Generated') ? 'User Generated' : 'Admin Given'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {t.scheduled_for && new Date(t.scheduled_for) > new Date() ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderRadius: '4px', fontSize: '10px', fontWeight: 600, width: 'fit-content' }}>
                        <Calendar size={10} /> Scheduled
                      </span>
                      <span style={{ fontSize: '11px' }}>{new Date(t.scheduled_for).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ) : (
                    new Date(t.created_at).toLocaleDateString()
                  )}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    {taskCategory === 'karma_farm' && (
                      <button
                        onClick={() => handleViewClaims(t.id)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-medium)',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--accent-blue)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        title="View Claims"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                    )}
                    <button
                      onClick={() => handleEditTask(t)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-default)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      title="Edit Task"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      disabled={deletingId === t.id}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: deletingId === t.id ? 'not-allowed' : 'pointer',
                        opacity: deletingId === t.id ? 0.6 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      title="Delete Task"
                    >
                      <Trash2 size={12} /> {deletingId === t.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="admin-mobile-cards">
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            No tasks found matching your search.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div key={t.id} className="admin-card-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.task_seq_id && t.task_category !== 'karma_farm' && !t.title?.startsWith('User-Generated') ? `Task ID: ${t.task_seq_id} - ` : ''}{t.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {t.flair && (
                      <span style={{ display: 'inline-block', padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '11px' }}>
                        {t.flair}
                      </span>
                    )}
                    {t.task_category === 'karma_farm' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <Sparkles size={10} /> Karma Farm
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
                  ${t.payment_amount?.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {t.post_link || t.subreddits?.name ? (
                    <a 
                      href={t.post_link || `https://www.reddit.com/r/${t.subreddits?.name}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {t.subreddit_id === null ? '🌐 Open for All' : `r/${t.subreddits?.name || 'Unknown'}`} ↗
                    </a>
                  ) : (
                    <span>
                      {t.subreddit_id === null ? '🌐 Open for All' : `r/${t.subreddits?.name || 'Unknown'}`}
                    </span>
                  )}
                  <span>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    👥 {t.active_claims_count || 0}/{t.max_claims || 1} slots
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t.task_type === 'comment' ? (
                      <>
                        <MessageSquare size={13} style={{ color: '#3b82f6' }} />
                        Comment
                      </>
                    ) : t.task_type === 'upvote' ? (
                      <>
                        <ArrowBigUp size={13} style={{ color: '#f97316' }} />
                        Upvote
                      </>
                    ) : t.task_type === 'crosspost' ? (
                      <>
                        <Share2 size={13} style={{ color: '#a855f7' }} />
                        Crosspost
                      </>
                    ) : (t.content_mode === 'image' || Boolean(t.image_url)) ? (
                      <>
                        <ImageIcon size={13} style={{ color: '#10b981' }} />
                        Image
                      </>
                    ) : (
                      <>
                        <Type size={13} style={{ color: '#8b5cf6' }} />
                        Text
                      </>
                    )}
                  </span>
                  <span>•</span>
                  {t.scheduled_for && new Date(t.scheduled_for) > new Date() ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      <Calendar size={10} /> {new Date(t.scheduled_for).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span style={{ 
                  fontSize: '11px', fontWeight: 600,
                  color: t.title?.startsWith('User-Generated') ? 'var(--accent-blue)' : 'var(--text-secondary)'
                }}>
                  {t.title?.startsWith('User-Generated') ? 'User Generated' : 'Admin Given'}
                </span>
              </div>

              {/* Mobile Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                {taskCategory === 'karma_farm' && (
                  <button
                    onClick={() => handleViewClaims(t.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--accent-blue)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ExternalLink size={13} /> View
                  </button>
                )}
                <button
                  onClick={() => handleEditTask(t)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(t.id)}
                  disabled={deletingId === t.id}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: deletingId === t.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={13} /> {deletingId === t.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '12px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="admin-modal-box" style={{ maxWidth: '560px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingTaskId ? 'Edit Task' : 'Create New Task'}
                </h2>
                <button onClick={() => { resetForm(); setIsModalOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>

              <form onSubmit={handleFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Subreddit *</label>
                  <select 
                    required 
                    value={subredditId} 
                    onChange={e => handleSubredditChange(e.target.value)}
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

                {/* Schedule Task Option */}
                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: `1px solid ${isScheduled ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-medium)'}`, transition: 'border-color 0.2s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => {
                        setIsScheduled(e.target.checked);
                        if (!e.target.checked) setScheduledFor('');
                      }}
                      style={{ accentColor: '#a855f7', width: '18px', height: '18px' }}
                    />
                    <Calendar size={16} style={{ color: isScheduled ? '#a855f7' : 'var(--text-muted)' }} />
                    Schedule this task for later
                  </label>
                  {isScheduled && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Publish Date & Time *</label>
                      <input
                        type="datetime-local"
                        required={isScheduled}
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          colorScheme: 'dark'
                        }}
                      />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Task will remain hidden from workers until this date/time.
                      </p>
                    </div>
                  )}
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

                {taskCategory !== 'karma_farm' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Task Category *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'post', label: 'Post', icon: <Type size={14} /> },
                        { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} /> },
                        { id: 'upvote', label: 'Upvote', icon: <ArrowBigUp size={14} /> },
                        { id: 'crosspost', label: 'Crosspost', icon: <Share2 size={14} /> },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryChange(cat.id as any)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '10px',
                            border: mainCategory === cat.id ? '2px solid var(--accent-blue)' : '1px solid var(--border-medium)',
                            background: mainCategory === cat.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-elevated)',
                            color: mainCategory === cat.id ? 'var(--accent-blue)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            fontSize: '13px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mainCategory === 'karma_farm' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Karma Task Type *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['post', 'comment'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setKarmaFarmType(type as 'post' | 'comment')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: karmaFarmType === type ? '2px solid var(--accent-blue)' : '1px solid var(--border-medium)',
                            background: karmaFarmType === type ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-elevated)',
                            color: karmaFarmType === type ? 'var(--accent-blue)' : 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {type === 'post' ? 'Post' : 'Comment'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* UPVOTE TASK FIELDS */}
                {mainCategory === 'upvote' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Reddit Post Link (To Upvote) *</label>
                      <input 
                        required 
                        type="url" 
                        value={postLink} 
                        onChange={e => setPostLink(e.target.value)} 
                        placeholder="https://www.reddit.com/r/.../comments/..." 
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                      />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Workers will be directed to open and upvote this Reddit post.</p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Number of Slots (Workers) *</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        value={slots} 
                        onChange={e => setSlots(e.target.value)} 
                        placeholder="e.g. 10"
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                      />
                    </div>
                  </>
                )}

                {/* CROSSPOST TASK FIELDS */}
                {mainCategory === 'crosspost' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Original Reddit Post Link (To Crosspost) *
                      </label>
                      <input 
                        required 
                        type="url" 
                        value={postLink} 
                        onChange={e => setPostLink(e.target.value)} 
                        placeholder="https://www.reddit.com/r/.../comments/..." 
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                      />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Workers will be directed to crosspost this original post.</p>
                    </div>

                    {/* Manual Crosspost Subreddit Link Field */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Crosspost Subreddit Link *
                        </label>
                        {crosspostSubLink && (
                          <a
                            href={crosspostSubLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--accent-blue)',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none'
                            }}
                          >
                            Open Link <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <input 
                        required 
                        type="url" 
                        value={crosspostSubLink} 
                        onChange={e => setCrosspostSubLink(e.target.value)} 
                        placeholder="https://www.reddit.com/r/..." 
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                      />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Destination subreddit link where workers will submit the crosspost.
                      </p>
                    </div>
                  </>
                )}

                {/* POST SPECIFIC FIELDS */}
                {(mainCategory === 'post' || (mainCategory === 'karma_farm' && karmaFarmType === 'post')) && (
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

                {/* CONTENT SOURCE FOR POST & COMMENT */}
                {(mainCategory === 'post' || mainCategory === 'comment') && (
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
                )}

                {(mainCategory === 'comment' || (mainCategory === 'karma_farm' && karmaFarmType === 'comment')) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Post Link *</label>
                    <input required type="url" value={postLink} onChange={e => setPostLink(e.target.value)} placeholder="Link to the reddit post" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                {(mainCategory === 'post' || (mainCategory === 'karma_farm' && karmaFarmType === 'post')) && contentSource === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Post Title *</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Compulsory" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                {(mainCategory === 'post' || (mainCategory === 'karma_farm' && karmaFarmType === 'post')) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Subreddit Link *</label>
                    <input 
                      required 
                      type="url" 
                      value={postLink} 
                      onChange={e => setPostLink(e.target.value)} 
                      placeholder="https://www.reddit.com/r/..." 
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                    />
                  </div>
                )}

                {(mainCategory === 'post' || (mainCategory === 'karma_farm' && karmaFarmType === 'post')) && contentSource === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Flair (Optional)</label>
                    <input type="text" value={flair} onChange={e => setFlair(e.target.value)} placeholder="e.g. Discussion" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                {(mainCategory === 'post' || (mainCategory === 'karma_farm' && karmaFarmType === 'post')) && contentSource === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Post Body (Optional)</label>
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="What should they post? (Optional)" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }} />
                  </div>
                )}

                {(mainCategory === 'comment' || (mainCategory === 'karma_farm' && karmaFarmType === 'comment')) && contentSource === 'provided' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Comment Content *</label>
                    <textarea required value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Exact comment to post" style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }} />
                  </div>
                )}

                {((mainCategory === 'post' || (mainCategory === 'karma_farm' && karmaFarmType === 'post')) && taskType === 'image' && contentSource === 'provided') && (
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

                {(((mainCategory === 'post' || mainCategory === 'comment') && contentSource === 'custom')) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Number of Slots (Workers) *</label>
                    <input required type="number" min="1" value={slots} onChange={e => setSlots(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </div>
                )}

                {mainCategory !== 'karma_farm' && (
                  <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Payment Amount</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <input type="radio" checked={paymentType === 'base'} onChange={() => setPaymentType('base')} /> 
                        Base Amount (${mainCategory === 'upvote' ? '0.05' : mainCategory === 'crosspost' ? '0.20' : mainCategory === 'post' ? (contentSource === 'provided' ? '0.20' : '0.25') : (contentSource === 'provided' ? '0.05' : '0.10')})
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
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={() => { resetForm(); setIsModalOpen(false); }} className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '12px', justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? (editingTaskId ? 'Saving...' : 'Creating...') : (editingTaskId ? 'Save Changes' : 'Create Task')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Claims Modal */}
      <AnimatePresence>
        {viewingClaimsTaskId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '12px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="admin-modal-box" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Task Claims (Karma Farm)
                </h2>
                <button onClick={() => setViewingClaimsTaskId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={24} /></button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                {isLoadingClaims ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading claims...</div>
                ) : taskClaims.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    No one has claimed this task yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {taskClaims.map((claim) => (
                      <div key={claim.id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {claim.users?.full_name ? `${claim.users.full_name} (${claim.users.email})` : claim.users?.email}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '20px' }}>
                            Claimed
                          </span>
                        </div>
                        {claim.reddit_accounts?.reddit_profile_link && (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Reddit Profile:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>u/{getRedditUsername(claim.reddit_accounts.reddit_profile_link)}</span>
                            <a href={claim.reddit_accounts.reddit_profile_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                              (View Profile ↗)
                            </a>
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Claimed on {new Date(claim.claimed_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
