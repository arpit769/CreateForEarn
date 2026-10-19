'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Plus, ArrowUp, ArrowUpRight, MoreVertical, Wallet, 
  ClipboardList, Users, BarChart2, CheckCircle2, 
  ExternalLink, Sparkles, X as CloseIcon, Check, 
  ShieldCheck, HelpCircle, Send, DollarSign, Eye, PlaySquare, Filter,
  Lock, Sliders, Info, Type, MessageSquare, ArrowBigUp, Share2,
  Image as ImageIcon, Film, ThumbsUp, CornerDownRight, UserPlus,
  Video, Camera, Heart, Repeat, Hash, Bookmark, FileText, UploadCloud, Headphones
} from 'lucide-react';
import { getClientTaskRates } from '@/actions/users';
import { submitClientCampaign, getClientCampaigns } from '@/actions/campaigns';
import { ClientTaskRates, DEFAULT_TASK_RATES, TaskRateItem } from '@/types/task-rates';
import { PlatformLogo } from '@/components/common/PlatformLogo';

// ==========================================
// Admin Contact Links for Wallet Top Up
// ==========================================
export const ADMIN_WHATSAPP_PHONE = "+91 7800200982";
export const ADMIN_WHATSAPP_LINK = "https://wa.me/917800200982";
export const ADMIN_TELEGRAM_HANDLE = "@arpit152";
export const ADMIN_TELEGRAM_LINK = "https://t.me/arpit152";

const WhatsAppIcon = ({ size = 20, color = "#ffffff", style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.49 3.67 12.05 3.67ZM9.14 7.29C8.97 7.29 8.7 7.35 8.46 7.61C8.23 7.87 7.57 8.49 7.57 9.76C7.57 11.03 8.5 12.25 8.63 12.42C8.76 12.6 10.42 15.15 12.96 16.25C13.56 16.51 14.03 16.66 14.4 16.78C15.01 16.97 15.56 16.94 16 16.88C16.5 16.8 17.53 16.25 17.74 15.65C17.96 15.06 17.96 14.55 17.89 14.45C17.83 14.34 17.65 14.28 17.39 14.15C17.13 14.02 15.84 13.38 15.6 13.29C15.37 13.21 15.2 13.16 15.03 13.42C14.86 13.68 14.37 14.28 14.22 14.45C14.08 14.62 13.93 14.64 13.67 14.51C13.41 14.38 12.58 14.11 11.59 13.23C10.82 12.54 10.3 11.69 10.15 11.43C10.01 11.17 10.13 11.03 10.26 10.9C10.38 10.78 10.53 10.58 10.66 10.43C10.79 10.28 10.83 10.17 10.92 10C11 9.83 10.96 9.68 10.89 9.55C10.83 9.42 10.3 8.14 10.08 7.62C9.87 7.11 9.65 7.18 9.49 7.17C9.34 7.17 9.17 7.29 9.14 7.29Z" />
  </svg>
);

const TelegramIcon = ({ size = 20, color = "#ffffff", style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.84 8.67c-.14.62-.51.78-1.03.49l-2.8-2.06-1.35 1.3c-.15.15-.28.28-.57.28l.2-2.84 5.17-4.67c.23-.2-.05-.31-.35-.11L8.03 13.1l-2.75-.86c-.6-.19-.61-.6.13-.89l10.74-4.14c.5-.18.96.13.79.79z" />
  </svg>
);

interface CampaignItem {
  id: string;
  name: string;
  platform: 'x' | 'instagram' | 'linkedin' | 'quora' | 'reddit' | 'youtube';
  taskType?: string;
  tasks: number;
  submissions: number;
  spent: number;
  status: 'Active' | 'Completed' | 'Draft' | 'Paused' | 'Pending Review' | 'Rejected';
  createdOn: string;
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [];

type PlatformKey = 'x' | 'instagram' | 'linkedin' | 'quora' | 'reddit' | 'youtube';

export interface PlatformActionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  rateKey: keyof TaskRateItem;
  desc: string;
}

export const PLATFORM_TASK_CONFIGS: Record<PlatformKey, PlatformActionConfig[]> = {
  reddit: [
    { id: 'post', label: 'Post', icon: <Type size={14} />, rateKey: 'post', desc: 'Publish a new post to target subreddit' },
    { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} />, rateKey: 'comment', desc: 'Leave an organic engagement comment' },
    { id: 'upvote', label: 'Upvote', icon: <ArrowBigUp size={14} />, rateKey: 'upvote', desc: 'Upvote a targeted Reddit post' },
    { id: 'crosspost', label: 'Crosspost', icon: <Share2 size={14} />, rateKey: 'reshare', desc: 'Crosspost to a destination subreddit' },
  ],
  youtube: [
    { id: 'like', label: 'Like', icon: <ThumbsUp size={14} />, rateKey: 'upvote', desc: 'Like targeted YouTube video' },
    { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} />, rateKey: 'comment', desc: 'Comment on YouTube video' },
    { id: 'comment_reply', label: 'Comment Reply', icon: <CornerDownRight size={14} />, rateKey: 'comment', desc: 'Reply to comments on a video' },
    { id: 'subscribe', label: 'Subscribe', icon: <UserPlus size={14} />, rateKey: 'follow', desc: 'Subscribe to YouTube channel' },
    { id: 'post', label: 'Post', icon: <Video size={14} />, rateKey: 'post', desc: 'Post / Upload a YouTube video' },
  ],
  x: [
    { id: 'post', label: 'Post', icon: <FileText size={14} />, rateKey: 'post', desc: 'Post a tweet / announcement on X' },
    { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} />, rateKey: 'comment', desc: 'Reply / comment to an X tweet' },
    { id: 'like', label: 'Like', icon: <ThumbsUp size={14} />, rateKey: 'upvote', desc: 'Like targeted tweet on X' },
    { id: 'repost', label: 'Repost', icon: <Share2 size={14} />, rateKey: 'reshare', desc: 'Retweet / Repost content on X' },
    { id: 'quote_post', label: 'Quote Post', icon: <Repeat size={14} />, rateKey: 'reshare', desc: 'Quote retweet with commentary' },
    { id: 'follow', label: 'Follow', icon: <UserPlus size={14} />, rateKey: 'follow', desc: 'Follow brand profile on X' },
    { id: 'bookmark', label: 'Bookmark', icon: <Bookmark size={14} />, rateKey: 'upvote', desc: 'Bookmark targeted post on X' },
  ],
  quora: [
    { id: 'answer', label: 'Answer', icon: <HelpCircle size={14} />, rateKey: 'post', desc: 'Answer questions on Quora' },
    { id: 'upvote', label: 'Upvote', icon: <ThumbsUp size={14} />, rateKey: 'upvote', desc: 'Upvote answers on Quora' },
    { id: 'follow', label: 'Follow Profile', icon: <UserPlus size={14} />, rateKey: 'follow', desc: 'Follow author / profile on Quora' },
    { id: 'follow_topic', label: 'Follow Topic', icon: <Hash size={14} />, rateKey: 'follow', desc: 'Follow targeted Quora topic' },
    { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} />, rateKey: 'comment', desc: 'Comment under Quora answer' },
    { id: 'share', label: 'Share', icon: <Share2 size={14} />, rateKey: 'reshare', desc: 'Share Quora answer' },
  ],
  instagram: [
    { id: 'post', label: 'Post', icon: <Camera size={14} />, rateKey: 'post', desc: 'Publish post or reel on Instagram' },
    { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} />, rateKey: 'comment', desc: 'Comment on Instagram post or reel' },
    { id: 'like', label: 'Like', icon: <Heart size={14} />, rateKey: 'upvote', desc: 'Like targeted post or reel' },
    { id: 'follow', label: 'Follow Profile', icon: <UserPlus size={14} />, rateKey: 'follow', desc: 'Follow Instagram business account' },
    { id: 'save', label: 'Save', icon: <Bookmark size={14} />, rateKey: 'upvote', desc: 'Save Instagram post / bookmark' },
    { id: 'reel_view', label: 'Reel View', icon: <Film size={14} />, rateKey: 'upvote', desc: 'Watch Instagram Reel video' },
    { id: 'story_view', label: 'Story View', icon: <Eye size={14} />, rateKey: 'upvote', desc: 'View active Instagram stories' },
  ],
  linkedin: [
    { id: 'post', label: 'Post', icon: <FileText size={14} />, rateKey: 'post', desc: 'Publish a LinkedIn professional post' },
    { id: 'comment', label: 'Comment', icon: <MessageSquare size={14} />, rateKey: 'comment', desc: 'Comment on targeted LinkedIn post' },
    { id: 'like', label: 'Like / Reaction', icon: <ThumbsUp size={14} />, rateKey: 'upvote', desc: 'Like / React to LinkedIn post' },
    { id: 'repost', label: 'Repost', icon: <Repeat size={14} />, rateKey: 'reshare', desc: 'Repost content to LinkedIn network' },
    { id: 'follow', label: 'Follow', icon: <UserPlus size={14} />, rateKey: 'follow', desc: 'Follow LinkedIn company page' },
    { id: 'connect', label: 'Connect', icon: <Users size={14} />, rateKey: 'follow', desc: 'Connect with targeted LinkedIn profile' },
    { id: 'share', label: 'Share', icon: <Share2 size={14} />, rateKey: 'reshare', desc: 'Share post to LinkedIn feed' },
  ],
};

export const isSlotTaskType = (action?: string) => {
  if (!action) return false;
  return [
    'like',
    'follow',
    'follow_topic',
    'share',
    'upvote',
    'subscribe',
    'repost',
    'quote_post',
    'bookmark',
    'save',
    'reel_view',
    'story_view',
    'connect',
  ].includes(action);
};

export function getDefaultPlatformGuidelines(
  platform: PlatformKey,
  action: string,
  contentSource: 'provided' | 'custom' = 'provided',
  subtype: string = 'text'
): string {
  switch (platform) {
    case 'reddit':
      switch (action) {
        case 'post':
          return contentSource === 'provided'
            ? '1. Copy the provided post title and body exactly as specified.\n2. Submit the post to the specified subreddit, ensuring clean paragraph spacing.\n3. Make sure the post is public and follows the subreddit rules.\n4. Submit your live Reddit post URL as proof.'
            : '1. Write an engaging, original, and authentic Reddit post relevant to the subreddit topic.\n2. Avoid direct promotional hype; keep the tone helpful, community-focused, and natural.\n3. Submit your live Reddit post link as proof.';
        case 'comment':
          return contentSource === 'provided'
            ? '1. Open the target Reddit post link.\n2. Post the exact comment text provided below.\n3. Ensure your comment is visible and not filtered.\n4. Submit your direct comment permalink as proof.'
            : '1. Open the target Reddit post link.\n2. Read the post and leave a constructive, genuine, and contextually relevant comment (at least 15-20 words).\n3. Submit your direct comment permalink as proof.';
        case 'upvote':
          return '1. Open the target Reddit post or comment link.\n2. Upvote the exact post or comment (check attached reference screenshot if provided) using your active Reddit account.\n3. Take a clear screenshot of your screen showing the orange upvote arrow active.\n4. Upload the screenshot as proof.';
        case 'crosspost':
          return '1. Open the original Reddit post link.\n2. Click "Share" -> "Crosspost" and select the destination subreddit specified.\n3. Ensure the crosspost remains live and visible.\n4. Submit the live crosspost URL as proof.';
        default:
          return 'Follow the specified Reddit task instructions and submit your live link or screenshot proof.';
      }

    case 'youtube':
      switch (action) {
        case 'like':
          return '1. Open the target YouTube video or comment link.\n2. Like the exact video or comment (check attached reference screenshot if provided) with your active account.\n3. Take a clear screenshot showing the thumbs up active.\n4. Upload the screenshot proof.';
        case 'comment':
          return '1. Open the target YouTube video or comment link.\n2. Watch a portion of the video and leave a genuine, contextually relevant, and positive comment.\n3. Take a screenshot showing your posted comment and upload proof.';
        case 'comment_reply':
          return '1. Open the target YouTube video link and locate the pinned or highlighted comment thread (check reference screenshot if provided).\n2. Post a helpful, constructive reply to the thread.\n3. Take a screenshot showing your published reply and upload proof.';
        case 'subscribe':
          return '1. Open the target YouTube channel link.\n2. Click the "Subscribe" button using your active YouTube account.\n3. Verify that the button status changes to "Subscribed".\n4. Take a clear screenshot showing "Subscribed" and upload proof.';
        case 'post':
          return '1. Upload the provided video/short or creative video to your active YouTube channel as instructed.\n2. Ensure title, description, and visibility are public.\n3. Submit your live YouTube video URL as proof.';
        default:
          return 'Follow the specified YouTube task instructions and submit your proof.';
      }

    case 'x':
      switch (action) {
        case 'post':
          return contentSource === 'provided'
            ? '1. Post the provided text and media verbatim on your active X account.\n2. Ensure formatting is clean, hashtags are included, and visibility is public.\n3. Submit your live tweet URL as proof.'
            : '1. Compose an original, engaging tweet on X discussing the specified topic/brand naturally.\n2. Keep it natural, relevant, and engaging without sounding like spam.\n3. Submit your live tweet URL as proof.';
        case 'comment':
          return contentSource === 'provided'
            ? '1. Open the target tweet on X.\n2. Reply with the exact comment text provided below.\n3. Submit your reply URL as proof.'
            : '1. Open the target tweet on X.\n2. Write and post a thoughtful, contextually relevant reply to the tweet.\n3. Submit your reply URL as proof.';
        case 'like':
          return '1. Open the target tweet or reply link on X.\n2. Like the exact tweet or reply (check attached reference screenshot if provided) with your active X account.\n3. Take a clear screenshot showing the pink/red heart active.\n4. Upload the screenshot proof.';
        case 'repost':
          return '1. Open the target tweet on X.\n2. Repost (Retweet) the tweet to your profile feed.\n3. Take a screenshot showing the green repost icon active on the tweet.\n4. Upload the screenshot proof.';
        case 'quote_post':
          return contentSource === 'provided'
            ? '1. Open the target tweet on X.\n2. Quote Post (Retweet with comment) using the exact text provided below.\n3. Publish and submit your Quote Tweet URL as proof.'
            : '1. Open the target tweet on X.\n2. Quote Post (Retweet with comment) adding your genuine thoughts/opinion on the topic.\n3. Publish and submit your Quote Tweet URL as proof.';
        case 'follow':
          return '1. Open the target X profile link.\n2. Click the "Follow" button using your active, verified X account.\n3. Ensure the button displays "Following".\n4. Take a clear screenshot showing "Following" and upload proof.';
        case 'bookmark':
          return '1. Open the target tweet on X.\n2. Bookmark the post using your active X account.\n3. Take a screenshot showing the post saved in your bookmarks.\n4. Upload the screenshot proof.';
        default:
          return 'Follow the specified X task instructions and submit proof.';
      }

    case 'quora':
      switch (action) {
        case 'answer':
          return contentSource === 'provided'
            ? '1. Go to the target Quora question link.\n2. Post the provided answer verbatim with clean paragraph formatting.\n3. Ensure the answer is published publicly and visible.\n4. Submit your live answer URL as proof.'
            : '1. Open the target Quora question link.\n2. Write a detailed, informative, and high-quality answer in your own words (at least 100-150 words).\n3. Keep it natural, helpful, and free of low-effort spam.\n4. Submit your live answer URL as proof.';
        case 'upvote':
          return '1. Open the target Quora answer or comment link.\n2. Upvote the exact answer or comment (check attached reference screenshot if provided) using your active Quora account.\n3. Take a clear screenshot showing your upvote active.\n4. Upload the screenshot proof.';
        case 'follow':
          return '1. Open the target Quora author profile link.\n2. Click "Follow" to follow the author.\n3. Take a clear screenshot showing the button as "Following" and upload proof.';
        case 'follow_topic':
          return '1. Open the target Quora topic link.\n2. Click "Follow" on the topic page.\n3. Take a screenshot showing you are following the topic and upload proof.';
        case 'comment':
          return contentSource === 'provided'
            ? '1. Open the target Quora answer link.\n2. Post the exact comment text provided below.\n3. Submit your comment URL or screenshot proof.'
            : '1. Open the target Quora answer link.\n2. Leave a thoughtful, natural comment related to the answer content.\n3. Submit your comment URL or screenshot proof.';
        case 'share':
          return '1. Open the target Quora question or answer.\n2. Share it to your Quora Space or profile feed.\n3. Take a screenshot showing the shared post and upload proof.';
        default:
          return 'Follow the specified Quora task instructions and submit proof.';
      }

    case 'instagram':
      switch (action) {
        case 'post':
          if (subtype === 'video') {
            return contentSource === 'provided'
              ? '1. Download the provided Reel video and copy the provided caption.\n2. Upload it as an Instagram Reel using your active verified Instagram account.\n3. Ensure the Reel is public and visible.\n4. Submit your live Reel URL and screenshot proof.'
              : '1. Create a high-quality, engaging video Reel relevant to the campaign topic.\n2. Publish it publicly on your active verified Instagram profile.\n3. Submit your live Instagram Reel URL and screenshot proof.';
          } else if (subtype === 'story') {
            return '1. Post the provided/requested creative asset to your Instagram Story.\n2. Include the target tag or link sticker if specified.\n3. Ensure the story is public.\n4. Take a screenshot of the live story and upload proof.';
          } else {
            return contentSource === 'provided'
              ? '1. Copy the provided caption and attach the provided image media.\n2. Publish it as a feed post on your active Instagram profile (public visibility).\n3. Submit your live Instagram post URL and screenshot proof.'
              : '1. Create an authentic, high-quality image post based on the campaign requirements.\n2. Publish it publicly on your active Instagram profile.\n3. Submit your live Instagram post URL and screenshot proof.';
          }
        case 'comment':
          return contentSource === 'provided'
            ? '1. Open the target Instagram post or Reel link.\n2. Post the exact comment text provided below using your active Instagram account.\n3. Submit a direct comment link and screenshot proof.'
            : '1. Open the target Instagram post or Reel link.\n2. Leave a genuine, thoughtful comment (at least 8-10 words) relevant to the content.\n3. Take a screenshot showing your posted comment and submit.';
        case 'like':
          return '1. Open the target Instagram post, Reel, or comment link.\n2. Like the exact post or comment (check attached reference screenshot if provided) with your active account.\n3. Take a clear screenshot showing the liked target (red heart active).\n4. Upload the screenshot proof.';
        case 'follow':
          return '1. Open the target Instagram profile URL.\n2. Follow the account using your active Instagram account.\n3. Ensure the profile displays "Following".\n4. Take a clear screenshot showing "Following" and upload proof.';
        case 'save':
          return '1. Open the target Instagram post or Reel link.\n2. Tap the bookmark icon to save the post to your Instagram collection.\n3. Take a screenshot showing the bookmark highlighted.\n4. Upload the screenshot proof.';
        case 'reel_view':
          return '1. Open the target Instagram Reel link.\n2. Watch the Reel completely from start to finish.\n3. Take a screenshot during or after watching the Reel.\n4. Upload screenshot proof.';
        case 'story_view':
          return '1. Open the target Instagram profile / story link.\n2. View all active stories completely.\n3. Take a screenshot showing you viewed the story.\n4. Upload screenshot proof.';
        default:
          return 'Follow the specified Instagram task instructions and submit proof.';
      }

    case 'linkedin':
      switch (action) {
        case 'post':
          return contentSource === 'provided'
            ? '1. Copy the provided post text and media.\n2. Publish it publicly on your active LinkedIn profile (visibility set to "Anyone").\n3. Submit your live LinkedIn post URL and screenshot proof.'
            : '1. Write an engaging, professional post based on the requested topic/guidelines.\n2. Publish it publicly on your active LinkedIn profile (visibility set to "Anyone").\n3. Submit your live LinkedIn post URL and screenshot proof.';
        case 'comment':
          return contentSource === 'provided'
            ? '1. Open the target LinkedIn post link.\n2. Post the provided comment text exactly as given using your active LinkedIn profile.\n3. Submit your comment link and a screenshot showing your posted comment.'
            : '1. Open the target LinkedIn post link.\n2. Read the post and leave a thoughtful, professional comment (at least 15-20 words).\n3. Submit your comment link and a screenshot showing your posted comment.';
        case 'like':
          return '1. Open the target LinkedIn post or comment link.\n2. React to the exact post or comment (check attached reference screenshot if provided) using your active LinkedIn profile.\n3. Take a clear screenshot showing your reaction active on the post or comment.\n4. Upload the screenshot proof.';
        case 'repost':
          return '1. Open the target LinkedIn post link.\n2. Click "Repost" to share it directly to your LinkedIn network.\n3. Take a screenshot showing the post on your profile or feed.\n4. Upload the screenshot proof.';
        case 'follow':
          return '1. Open the target LinkedIn Company Page / Creator profile link.\n2. Click the "+ Follow" button using your active LinkedIn account.\n3. Ensure the button displays "Following".\n4. Take a clear screenshot showing "Following" and upload proof.';
        case 'connect':
          return '1. Open the target LinkedIn profile link.\n2. Click "Connect" (or "More" -> "Connect") using your active LinkedIn profile.\n3. Send the connection request.\n4. Take a screenshot showing the sent/pending connection request and upload proof.';
        case 'share':
          return '1. Open the target LinkedIn post link.\n2. Click "Share" and share it with your LinkedIn network.\n3. Take a screenshot showing the shared post and upload proof.';
        default:
          return 'Follow the specified LinkedIn task instructions and submit proof.';
      }

    default:
      return '1. Follow the specified task guidelines.\n2. Perform the required action on the platform.\n3. Submit live URL and screenshot proof.';
  }
}

export default function ClientDashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);

  // Close actions dropdown on scroll or resize so it stays accurate
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClose = () => {
      setActiveMenuId(null);
      setMenuCoords(null);
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeMenuId]);

  // Task Rates assigned by Admin
  const [taskRates, setTaskRates] = useState<ClientTaskRates>(DEFAULT_TASK_RATES);
  const [ratePlatformTab, setRatePlatformTab] = useState<PlatformKey>('reddit');

  // Modals state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Wallet stats state
  const [walletBalance, setWalletBalance] = useState(650.00);
  const [totalSpent, setTotalSpent] = useState(1650.00);
  const [pendingAmount, setPendingAmount] = useState(120.00);

  // New task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPlatform, setNewTaskPlatform] = useState<PlatformKey>('reddit');
  const [newTaskAction, setNewTaskAction] = useState<string>('post');
  const [newTaskCount, setNewTaskCount] = useState('25');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [secondaryUrl, setSecondaryUrl] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('text');
  const [contentSource, setContentSource] = useState<'provided' | 'custom'>('provided');
  const [postBodyContent, setPostBodyContent] = useState('');
  const [newTaskInstructions, setNewTaskInstructions] = useState(() => 
    getDefaultPlatformGuidelines('reddit', 'post', 'provided', 'text')
  );

  // Media upload state & handlers
  const [mediaFiles, setMediaFiles] = useState<Array<{ id: string; file: File; previewUrl: string; name: string; type: 'image' | 'video' }>>([]);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const upvoteImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const handleMediaSelect = (incoming: FileList | File[] | null) => {
    if (!incoming || incoming.length === 0) return;
    const fileList = Array.from(incoming);
    const newItems: Array<{ id: string; file: File; previewUrl: string; name: string; type: 'image' | 'video' }> = [];

    fileList.forEach(file => {
      const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name);
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        type: isVid ? 'video' : 'image'
      });
    });

    if (newItems.length > 0) {
      setMediaFiles(prev => [...prev, ...newItems]);
    }
  };

  const handleRemoveMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleSelectSubtype = (st: string) => {
    setSelectedSubtype(st);
    mediaFiles.forEach(m => {
      if (m.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl);
    });
    setMediaFiles([]);
    setNewTaskInstructions(getDefaultPlatformGuidelines(newTaskPlatform, newTaskAction, contentSource, st));
  };

  // Top up form state
  const [topUpAmount, setTopUpAmount] = useState('100');
  const [topUpMethod, setTopUpMethod] = useState<'contact_admin' | 'crypto'>('contact_admin');

  // Load client's assigned task rates and campaigns on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [ratesRes, campaignsRes] = await Promise.all([
          getClientTaskRates(),
          getClientCampaigns()
        ]);
        if (ratesRes?.rates) {
          setTaskRates(ratesRes.rates);
        }
        if (campaignsRes?.campaigns) {
          const mapped: CampaignItem[] = campaignsRes.campaigns.map((c: any) => {
            const statusMap: Record<string, CampaignItem['status']> = {
              'pending_review': 'Pending Review',
              'approved': 'Active',
              'rejected': 'Rejected',
              'partially_approved': 'Active',
            };
            return {
              id: c.id,
              name: c.name,
              platform: c.platform,
              taskType: c.task_type,
              tasks: c.task_count,
              submissions: c.tasks_created || 0,
              spent: Number(c.total_budget),
              status: statusMap[c.status] || 'Pending Review',
              createdOn: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            };
          });
          setCampaigns(mapped);
        }
      } catch (err) {
        console.warn('Error loading dashboard data:', err);
      } finally {
        setIsCampaignsLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to get unit rate per platform & action
  const getUnitRate = (platform: PlatformKey, action: string) => {
    const list = PLATFORM_TASK_CONFIGS[platform] || [];
    const item = list.find(x => x.id === action);
    const rateKey = item?.rateKey || 'post';

    const direct = (taskRates[platform] as any)?.[action];
    if (typeof direct === 'number') return direct;

    const byKey = (taskRates[platform] as any)?.[rateKey];
    if (typeof byKey === 'number') return byKey;

    return (DEFAULT_TASK_RATES[platform] as any)?.[rateKey] ?? 10;
  };

  // Calculate current unit rate and total budget based on locked admin assignment
  const currentUnitRate = getUnitRate(newTaskPlatform, newTaskAction);
  const isSlotAction = isSlotTaskType(newTaskAction);
  const countVal = isSlotAction ? Math.max(1, parseInt(newTaskCount) || 1) : 1;
  const calculatedBudget = countVal * currentUnitRate;

  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);

  const handleSelectPlatform = (plt: PlatformKey) => {
    setNewTaskPlatform(plt);
    const list = PLATFORM_TASK_CONFIGS[plt] || [];
    const matched = list.find(x => x.id === newTaskAction);
    const nextAction = matched ? newTaskAction : (list[0]?.id || 'post');
    setNewTaskAction(nextAction);
    const nextSubtype = plt === 'instagram' ? 'image' : 'text';
    setSelectedSubtype(nextSubtype);
    setSecondaryUrl('');
    setPostBodyContent('');
    mediaFiles.forEach(m => {
      if (m.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl);
    });
    setMediaFiles([]);
    setNewTaskInstructions(getDefaultPlatformGuidelines(plt, nextAction, contentSource, nextSubtype));
  };

  const getTargetUrlConfig = (platform: PlatformKey, action: string) => {
    if (platform === 'reddit') {
      if (action === 'post') return { label: 'Subreddit Link *', placeholder: 'https://www.reddit.com/r/...' };
      if (action === 'crosspost') return { label: 'Original Reddit Post Link (To Crosspost) *', placeholder: 'https://www.reddit.com/r/.../comments/...' };
      if (action === 'upvote') return { label: 'Target Reddit Post Link or Comment Link (To Upvote) *', placeholder: 'https://www.reddit.com/r/.../comments/...' };
      return { label: 'Target Reddit Post Link (To Comment) *', placeholder: 'https://www.reddit.com/r/.../comments/...' };
    }
    if (platform === 'youtube') {
      if (action === 'subscribe') return { label: 'YouTube Channel URL *', placeholder: 'https://www.youtube.com/@channel' };
      if (action === 'post') return { label: 'Reference / Inspiration URL (Optional)', placeholder: 'https://www.youtube.com/...' };
      if (action === 'like') return { label: 'Target YouTube Video Link or Comment Link (To Like) *', placeholder: 'https://www.youtube.com/watch?v=... or comment link' };
      if (action === 'comment') return { label: 'Target YouTube Video Link or Comment Link (To Comment) *', placeholder: 'https://www.youtube.com/watch?v=... or comment link' };
      if (action === 'comment_reply') return { label: 'Target YouTube Video Link or Comment Link (To Reply) *', placeholder: 'https://www.youtube.com/watch?v=... or comment link' };
      return { label: 'YouTube Video URL *', placeholder: 'https://www.youtube.com/watch?v=...' };
    }
    if (platform === 'x') {
      if (action === 'follow') return { label: 'X / Twitter Profile URL *', placeholder: 'https://x.com/username' };
      if (action === 'post') return { label: 'Reference URL / Link to include (Optional)', placeholder: 'https://...' };
      if (action === 'like') return { label: 'Target X Post Link or Comment / Reply Link (To Like) *', placeholder: 'https://x.com/.../status/... or reply link' };
      if (action === 'comment') return { label: 'Target X Post Link or Comment / Reply Link (To Reply) *', placeholder: 'https://x.com/.../status/... or reply link' };
      if (action === 'repost') return { label: 'Target X Post Link or Comment Link (To Repost) *', placeholder: 'https://x.com/.../status/...' };
      return { label: 'Target X Post / Tweet URL *', placeholder: 'https://x.com/username/status/...' };
    }
    if (platform === 'quora') {
      if (action === 'follow') return { label: 'Quora Profile URL *', placeholder: 'https://www.quora.com/profile/...' };
      if (action === 'follow_topic') return { label: 'Quora Topic URL *', placeholder: 'https://www.quora.com/topic/...' };
      if (action === 'answer') return { label: 'Quora Question URL *', placeholder: 'https://www.quora.com/What-is-your-question' };
      if (action === 'upvote') return { label: 'Target Quora Answer Link or Comment Link (To Upvote) *', placeholder: 'https://www.quora.com/... or comment link' };
      if (action === 'comment') return { label: 'Target Quora Answer Link or Comment Link (To Comment) *', placeholder: 'https://www.quora.com/... or comment link' };
      return { label: 'Target Quora Question / Answer URL *', placeholder: 'https://www.quora.com/...' };
    }
    if (platform === 'instagram') {
      if (action === 'follow') return { label: 'Instagram Profile URL *', placeholder: 'https://www.instagram.com/username' };
      if (action === 'story_view') return { label: 'Instagram Profile / Story URL *', placeholder: 'https://www.instagram.com/username' };
      if (action === 'post') return { label: 'Reference Link (Optional)', placeholder: 'https://...' };
      if (action === 'like') return { label: 'Target Instagram Post Link or Comment Link (To Like) *', placeholder: 'https://www.instagram.com/p/... or comment link' };
      if (action === 'comment') return { label: 'Target Instagram Post Link or Comment Link (To Comment) *', placeholder: 'https://www.instagram.com/p/... or comment link' };
      return { label: 'Instagram Post / Reel URL *', placeholder: 'https://www.instagram.com/p/...' };
    }
    if (platform === 'linkedin') {
      if (action === 'follow' || action === 'connect') return { label: 'LinkedIn Profile / Company Page URL *', placeholder: 'https://www.linkedin.com/in/... or /company/...' };
      if (action === 'post') return { label: 'Reference / Article URL (Optional)', placeholder: 'https://...' };
      if (action === 'like') return { label: 'Target LinkedIn Post Link or Comment Link (To Like / React) *', placeholder: 'https://www.linkedin.com/posts/... or comment link' };
      if (action === 'comment') return { label: 'Target LinkedIn Post Link or Comment Link (To Comment) *', placeholder: 'https://www.linkedin.com/posts/... or comment link' };
      return { label: 'LinkedIn Post URL *', placeholder: 'https://www.linkedin.com/posts/...' };
    }
    return { label: 'Target Post / URL', placeholder: 'https://...' };
  };

  const getTitleConfig = (platform: PlatformKey, action: string) => {
    if (platform === 'youtube' && action === 'post') return { label: 'Video Title *', placeholder: 'e.g. Product Review & Walkthrough' };
    if (action === 'post' || action === 'answer') return { label: `${platform === 'quora' ? 'Question / Answer' : 'Post'} Title *`, placeholder: 'Compulsory' };
    return { label: 'Campaign Title', placeholder: 'e.g. Community Discussion & Launch Announcement' };
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    if (isSubmittingCampaign) return;

    if (calculatedBudget > walletBalance) {
      showToast('Insufficient wallet balance. Please top up your wallet first.');
      return;
    }

    setIsSubmittingCampaign(true);
    try {
      let uploadedMediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setIsUploadingMedia(true);
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        for (const m of mediaFiles) {
          const fileExt = m.file.name.split('.').pop() || (m.type === 'video' ? 'mp4' : 'jpg');
          const fileName = `client_${newTaskPlatform}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('task_images')
            .upload(fileName, m.file);
          if (!uploadError) {
            const { data: pubData } = supabase.storage.from('task_images').getPublicUrl(fileName);
            uploadedMediaUrls.push(pubData.publicUrl);
          } else {
            console.warn('Storage upload error:', uploadError.message);
          }
        }
      }

      const finalInstructions: string[] = [];
      if (selectedSubtype && (newTaskAction === 'post' || newTaskAction === 'quote_post' || newTaskAction === 'answer')) {
        finalInstructions.push(`[Post Format: ${selectedSubtype}]`);
      }
      if (
        (newTaskPlatform === 'reddit' && (newTaskAction === 'post' || newTaskAction === 'comment')) ||
        (newTaskPlatform === 'x' && (newTaskAction === 'post' || newTaskAction === 'comment' || newTaskAction === 'quote_post')) ||
        (newTaskPlatform === 'quora' && (newTaskAction === 'answer' || newTaskAction === 'comment')) ||
        (newTaskPlatform === 'linkedin' && (newTaskAction === 'post' || newTaskAction === 'comment'))
      ) {
        finalInstructions.push(`[Content Source: ${contentSource === 'provided' ? 'Client Provided Content' : 'User Generated Content (UGC)'}]`);
      }
      if (uploadedMediaUrls.length > 0) {
        finalInstructions.push(`[Attached Media: ${uploadedMediaUrls.join(', ')}]`);
      }
      if (postBodyContent.trim()) {
        finalInstructions.push(`[Post / Content Copy: ${postBodyContent.trim()}]`);
      }
      if (secondaryUrl.trim()) {
        finalInstructions.push(`[Destination Subreddit / Link: ${secondaryUrl.trim()}]`);
      }
      if (newTaskInstructions.trim()) {
        finalInstructions.push(newTaskInstructions.trim());
      }

      const compiledInstructions = finalInstructions.join('\n');

      const res = await submitClientCampaign({
        name: newTaskName,
        platform: newTaskPlatform,
        taskType: newTaskAction,
        taskCount: countVal,
        unitRate: currentUnitRate,
        totalBudget: calculatedBudget,
        targetUrl: newTaskLink || undefined,
        instructions: compiledInstructions || undefined,
      });

      if (res.error) {
        showToast(`Failed: ${res.error}`);
        return;
      }

      const newCamp: CampaignItem = {
        id: `camp-${Date.now()}`,
        name: newTaskName,
        platform: newTaskPlatform,
        taskType: newTaskAction,
        tasks: countVal,
        submissions: 0,
        spent: calculatedBudget,
        status: 'Pending Review',
        createdOn: 'Just now',
      };

      setCampaigns([newCamp, ...campaigns]);
      setIsCreateTaskOpen(false);
      setNewTaskName('');
      setNewTaskLink('');
      setSecondaryUrl('');
      setSelectedSubtype('text');
      setContentSource('provided');
      setPostBodyContent('');
      setNewTaskInstructions(getDefaultPlatformGuidelines('reddit', 'post', 'provided', 'text'));
      mediaFiles.forEach(m => {
        if (m.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl);
      });
      setMediaFiles([]);
      showToast(`Campaign "${newTaskName}" submitted for admin review!`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to submit campaign'}`);
    } finally {
      setIsSubmittingCampaign(false);
      setIsUploadingMedia(false);
    }
  };

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const addVal = parseFloat(topUpAmount) || 0;
    if (addVal > 0) {
      setWalletBalance(prev => prev + addVal);
      setIsTopUpOpen(false);
      if (topUpMethod === 'contact_admin') {
        showToast(`Deposit request of $${addVal.toFixed(2)} recorded! Please connect with admin on Discord or Telegram.`);
      } else {
        showToast(`$${addVal.toFixed(2)} added to your wallet!`);
      }
    }
  };

  // Platform Icon Component using authentic official SVGs
  const renderPlatformBadge = (platform: PlatformKey, size = 26) => {
    return <PlatformLogo platform={platform} size={size} />;
  };

  const getStatusBadgeStyle = (status: string) => {
    const bg = status === 'Active' 
      ? 'rgba(16, 185, 129, 0.12)' 
      : status === 'Pending Review'
      ? 'rgba(245, 158, 11, 0.12)'
      : status === 'Rejected'
      ? 'rgba(239, 68, 68, 0.12)'
      : 'rgba(59, 130, 246, 0.12)';
    const color = status === 'Active' ? '#10b981' 
      : status === 'Pending Review' ? '#f59e0b'
      : status === 'Rejected' ? '#ef4444'
      : '#3b82f6';
    return { bg, color };
  };

  return (
    <div className="client-dashboard-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="client-header">
        <div className="client-header__title-group">
          <h1 className="client-header__title">
            Welcome back, Brand Partner!
          </h1>
          <p className="client-header__subtitle">
            Launch campaigns with guaranteed real creator engagement across top platforms.
          </p>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={() => {
            setIsCreateTaskOpen(true);
            if (!newTaskInstructions.trim()) {
              setNewTaskInstructions(getDefaultPlatformGuidelines(newTaskPlatform, newTaskAction, contentSource, selectedSubtype));
            }
          }}
          className="client-header__cta"
        >
          <Plus size={18} strokeWidth={2.5} />
          Create New Task
        </button>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="client-stats-grid">
        {/* Total Campaigns */}
        <div className="client-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="client-stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <ClipboardList size={18} strokeWidth={2.2} />
            </div>
            <span className="client-stat-card__label">
              Active Campaigns
            </span>
          </div>
          <div className="client-stat-card__value">
            {campaigns.filter(c => c.status === 'Active').length}
          </div>
          <div className="client-stat-card__badge">
            <ArrowUp size={12} strokeWidth={3} />
            <span>High Engagement</span>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="client-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="client-stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Users size={18} strokeWidth={2.2} />
            </div>
            <span className="client-stat-card__label">
              Submissions
            </span>
          </div>
          <div className="client-stat-card__value">
            {campaigns.reduce((acc, c) => acc + c.submissions, 0).toLocaleString()}
          </div>
          <div className="client-stat-card__badge">
            <ArrowUp size={12} strokeWidth={3} />
            <span>98% Authentic</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="client-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="client-stat-card__icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Wallet size={18} strokeWidth={2.2} />
            </div>
            <span className="client-stat-card__label">
              Total Deployed
            </span>
          </div>
          <div className="client-stat-card__value">
            ${totalSpent.toFixed(2)}
          </div>
          <div className="client-stat-card__badge">
            <ArrowUp size={12} strokeWidth={3} />
            <span>100% Escrow</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="client-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="client-stat-card__icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <BarChart2 size={18} strokeWidth={2.2} />
            </div>
            <span className="client-stat-card__label">
              Completion Rate
            </span>
          </div>
          <div className="client-stat-card__value">
            96.4%
          </div>
          <div className="client-stat-card__badge">
            <ArrowUp size={12} strokeWidth={3} />
            <span>Fast Turnaround</span>
          </div>
        </div>
      </div>

      {/* Assigned Platform Rates Overview Banner */}
      <div className="client-rates-banner">
        <div className="client-rates-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#3b82f6" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                My Assigned Platform Task Rates
              </h3>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                Admin Verified
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Locked unit prices assigned to your account.
            </p>
          </div>

          {/* Platform Tab Switcher */}
          <div className="client-rates-tabs-wrapper">
            <div className="client-rates-tabs">
              {(['reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora'] as PlatformKey[]).map(plt => {
                const isSelected = ratePlatformTab === plt;
                const labels: Record<PlatformKey, string> = {
                  reddit: 'Reddit',
                  youtube: 'YouTube',
                  x: 'X',
                  instagram: 'Instagram',
                  linkedin: 'LinkedIn',
                  quora: 'Quora'
                };
                return (
                  <button
                    key={plt}
                    type="button"
                    onClick={() => setRatePlatformTab(plt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '7px',
                      border: isSelected ? '1px solid #0066FF' : '1px solid transparent',
                      background: isSelected ? 'rgba(0, 102, 255, 0.12)' : 'transparent',
                      color: isSelected ? '#0066FF' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <PlatformLogo platform={plt} size={14} />
                    <span>{labels[plt]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rates Display Cards */}
        <div className="client-rates-grid">
          {(PLATFORM_TASK_CONFIGS[ratePlatformTab] || []).map(cfg => {
            const unitRate = getUnitRate(ratePlatformTab, cfg.id);
            const isSlot = isSlotTaskType(cfg.id);
            return (
              <div key={cfg.id} className="client-rate-item">
                <div className="client-rate-item__label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </div>
                <div className="client-rate-item__price">
                  ${unitRate.toFixed(2)}
                  <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>
                    {isSlot ? ' / slot' : ' / task'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Recent Campaigns, Right Wallet + Quick Action */}
      <div className="client-main-grid">
        {/* Left Column: Recent Campaigns Card */}
        <div className="client-card">
          {/* Card Header */}
          <div className="client-card-header">
            <div>
              <h2 className="client-card-title">
                Recent Campaigns
              </h2>
              <p className="client-card-subtitle">
                Your latest campaigns and their performance.
              </p>
            </div>

            <Link
              href="/client/campaigns"
              className="client-card-view-all"
            >
              View All
            </Link>
          </div>

          {/* Desktop Table View (> 640px) */}
          <div className="client-campaigns-desktop-table">
            <div className="client-table-container">
              <table className="client-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Platform</th>
                    <th>Tasks</th>
                    <th>Submissions</th>
                    <th>Spent</th>
                    <th>Status</th>
                    <th>Created On</th>
                    <th style={{ textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                        {isCampaignsLoading ? 'Loading campaigns...' : 'No campaigns yet. Click "Create New Task" above to get started!'}
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((camp) => {
                      const { bg, color } = getStatusBadgeStyle(camp.status);
                      return (
                        <tr key={camp.id}>
                          {/* Campaign Name */}
                          <td>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              display: 'block'
                            }}>
                              {camp.name}
                            </span>
                          </td>

                          {/* Platform Badge */}
                          <td>
                            {renderPlatformBadge(camp.platform, 20)}
                          </td>

                          {/* Tasks / Slots */}
                          <td style={{ fontWeight: 600 }}>
                            {camp.tasks.toLocaleString()} {isSlotTaskType(camp.taskType) ? <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>slots</span> : null}
                          </td>

                          {/* Submissions */}
                          <td style={{ fontWeight: 600 }}>
                            {camp.submissions.toLocaleString()}
                          </td>

                          {/* Spent */}
                          <td style={{ fontWeight: 600 }}>
                            ${camp.spent.toFixed(2)}
                          </td>

                          {/* Status Pill */}
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '16px',
                              background: bg,
                              color: color,
                              whiteSpace: 'nowrap'
                            }}>
                              {camp.status}
                            </span>
                          </td>

                          {/* Created On */}
                          <td style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap'
                          }}>
                            {camp.createdOn}
                          </td>

                          {/* Actions Menu */}
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeMenuId === camp.id) {
                                  setActiveMenuId(null);
                                  setMenuCoords(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const openUp = spaceBelow < 125;
                                  setMenuCoords({
                                    top: openUp ? rect.top - 105 : rect.bottom + 4,
                                    right: Math.max(10, window.innerWidth - rect.right),
                                  });
                                  setActiveMenuId(camp.id);
                                }
                              }}
                              className={`client-action-menu-btn ${activeMenuId === camp.id ? 'active' : ''}`}
                              title="Campaign Actions"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (<= 640px) */}
          <div className="client-campaigns-mobile-list">
            {campaigns.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                {isCampaignsLoading ? 'Loading campaigns...' : 'No campaigns yet. Click "Create New Task" above to get started!'}
              </div>
            ) : (
              campaigns.map((camp) => {
                const { bg, color } = getStatusBadgeStyle(camp.status);
                return (
                  <div key={`m-${camp.id}`} className="client-campaign-mobile-card">
                    {/* Top Row: Platform Logo + Campaign Name & Date, Status Badge + Action Button */}
                    <div className="client-campaign-mobile-card__top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        {renderPlatformBadge(camp.platform, 22)}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="client-campaign-mobile-card__name" title={camp.name}>
                            {camp.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            {camp.createdOn}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '16px',
                          background: bg,
                          color: color,
                          whiteSpace: 'nowrap'
                        }}>
                          {camp.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === camp.id) {
                              setActiveMenuId(null);
                              setMenuCoords(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const openUp = spaceBelow < 125;
                              setMenuCoords({
                                top: openUp ? rect.top - 105 : rect.bottom + 4,
                                right: Math.max(10, window.innerWidth - rect.right),
                              });
                              setActiveMenuId(camp.id);
                            }
                          }}
                          className={`client-action-menu-btn ${activeMenuId === camp.id ? 'active' : ''}`}
                          title="Campaign Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Metrics Grid */}
                    <div className="client-campaign-mobile-card__metrics">
                      <div className="client-campaign-mobile-card__metric">
                        <span className="client-campaign-mobile-card__metric-label">Tasks</span>
                        <span className="client-campaign-mobile-card__metric-val">
                          {camp.tasks.toLocaleString()} {isSlotTaskType(camp.taskType) ? <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>slots</span> : null}
                        </span>
                      </div>
                      <div className="client-campaign-mobile-card__metric">
                        <span className="client-campaign-mobile-card__metric-label">Submissions</span>
                        <span className="client-campaign-mobile-card__metric-val">
                          {camp.submissions.toLocaleString()}
                        </span>
                      </div>
                      <div className="client-campaign-mobile-card__metric">
                        <span className="client-campaign-mobile-card__metric-label">Spent</span>
                        <span className="client-campaign-mobile-card__metric-val" style={{ color: '#0066FF' }}>
                          ${camp.spent.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Fixed Position Actions Dropdown (Completely immune to parent overflow clipping) */}
          {activeMenuId && menuCoords && (() => {
            const activeCamp = campaigns.find(c => c.id === activeMenuId);
            if (!activeCamp) return null;
            return (
              <>
                {/* Invisible backdrop to dismiss menu on click outside */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(null);
                    setMenuCoords(null);
                  }}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    cursor: 'default',
                    background: 'transparent'
                  }}
                />

                {/* Dropdown Menu */}
                <div
                  className="client-action-dropdown"
                  style={{
                    position: 'fixed',
                    top: `${menuCoords.top}px`,
                    right: `${menuCoords.right}px`,
                    zIndex: 9999,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.18), 0 3px 8px -2px rgba(0, 0, 0, 0.1)',
                    padding: '4px',
                    width: '135px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'clientDropdownFadeIn 0.12s ease-out'
                  }}
                >
                  <button
                    type="button"
                    className="client-action-dropdown-item"
                    onClick={() => {
                      setActiveMenuId(null);
                      setMenuCoords(null);
                      showToast(`Viewing details for ${activeCamp.name}`);
                    }}
                  >
                    <Eye size={13} style={{ color: '#0066FF' }} />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    className="client-action-dropdown-item"
                    onClick={() => {
                      setActiveMenuId(null);
                      setMenuCoords(null);
                      setNewTaskName(`${activeCamp.name} (Copy)`);
                      setNewTaskPlatform(activeCamp.platform);
                      if (activeCamp.taskType) setNewTaskAction(activeCamp.taskType);
                      setIsCreateTaskOpen(true);
                    }}
                  >
                    <Repeat size={13} style={{ color: '#10b981' }} />
                    <span>Duplicate Task</span>
                  </button>

                  <button
                    type="button"
                    className="client-action-dropdown-item"
                    onClick={() => {
                      setCampaigns(campaigns.map(c => c.id === activeCamp.id ? { ...c, status: c.status === 'Active' ? 'Completed' : 'Active' } : c));
                      setActiveMenuId(null);
                      setMenuCoords(null);
                      showToast(`Campaign status updated!`);
                    }}
                  >
                    <CheckCircle2 size={13} style={{ color: '#8b5cf6' }} />
                    <span>Toggle Status</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>

        {/* Right Column: Wallet Card + Promo Quick Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Wallet Balance Card */}
          <div className="client-card">
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wallet size={16} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Wallet Balance
                </span>
              </div>

              {/* Top Up Button */}
              <button
                onClick={() => setIsTopUpOpen(true)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  borderRadius: '7px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Top Up
              </button>
            </div>

            {/* Big Amount */}
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '14px'
            }}>
              ${walletBalance.toFixed(2)}
            </div>

            {/* Breakdown List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Spent</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${totalSpent.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Escrow</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${pendingAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Available Balance</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${walletBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW TASK (WITH LOCKED ADMIN RATES) */}
      {/* ======================================================== */}
      {isCreateTaskOpen && (
        <div className="client-modal-backdrop">
          <div className="client-modal-card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Create New Campaign Task
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Select platform and task action. Unit price is fixed per admin assignment.
                </p>
              </div>
              <button
                onClick={() => setIsCreateTaskOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              {/* Select Platform */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  1. Select Platform
                </label>
                <div className="client-platform-select-grid">
                  {(['reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora'] as PlatformKey[]).map(plt => {
                    const isSelected = newTaskPlatform === plt;
                    const labels: Record<PlatformKey, string> = {
                      reddit: 'Reddit',
                      youtube: 'YouTube',
                      x: 'X',
                      instagram: 'Instagram',
                      linkedin: 'LinkedIn',
                      quora: 'Quora'
                    };
                    return (
                      <button
                        key={plt}
                        type="button"
                        onClick={() => handleSelectPlatform(plt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0066FF' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'var(--bg-elevated)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isSelected ? '#0066FF' : 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <PlatformLogo platform={plt} size={22} />
                        <span>{labels[plt]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Task Action Type */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    2. {newTaskPlatform === 'quora' || newTaskPlatform === 'linkedin' ? 'Task Category *' : 'Task Type *'}
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Select target action for creators
                  </span>
                </div>
                
                <div className="client-action-select-grid">
                  {(PLATFORM_TASK_CONFIGS[newTaskPlatform] || []).map(act => {
                    const isSel = newTaskAction === act.id;
                    const actRate = getUnitRate(newTaskPlatform, act.id);
                    const isSlot = isSlotTaskType(act.id);
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setNewTaskAction(act.id);
                          mediaFiles.forEach(m => {
                            if (m.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl);
                          });
                          setMediaFiles([]);
                          setNewTaskInstructions(getDefaultPlatformGuidelines(newTaskPlatform, act.id, contentSource, selectedSubtype));
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: isSel ? '2px solid #0066FF' : '1px solid var(--border-subtle)',
                          background: isSel ? 'rgba(0, 102, 255, 0.08)' : 'var(--bg-elevated)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: isSel ? '#0066FF' : 'var(--text-primary)' }}>
                          {act.icon} {act.label}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '3px' }}>
                          ${actRate.toFixed(2)} {isSlot ? '/ slot' : '/ task'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Content Source Segmented Switch */}
                {((newTaskPlatform === 'reddit' && (newTaskAction === 'post' || newTaskAction === 'comment')) ||
                  (newTaskPlatform === 'x' && (newTaskAction === 'post' || newTaskAction === 'comment' || newTaskAction === 'quote_post')) ||
                  (newTaskPlatform === 'quora' && (newTaskAction === 'answer' || newTaskAction === 'comment')) ||
                  (newTaskPlatform === 'linkedin' && (newTaskAction === 'post' || newTaskAction === 'comment'))) && (
                  <div style={{ marginTop: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Content Source *
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      background: 'var(--bg-elevated)',
                      padding: '4px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setContentSource('provided');
                          setNewTaskInstructions(getDefaultPlatformGuidelines(newTaskPlatform, newTaskAction, 'provided', selectedSubtype));
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: contentSource === 'provided' ? '1.5px solid #0066FF' : '1px solid transparent',
                          background: contentSource === 'provided' ? 'rgba(0, 102, 255, 0.12)' : 'transparent',
                          color: contentSource === 'provided' ? '#0066FF' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Client Provided Content
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContentSource('custom');
                          setNewTaskInstructions(getDefaultPlatformGuidelines(newTaskPlatform, newTaskAction, 'custom', selectedSubtype));
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: contentSource === 'custom' ? '1.5px solid #0066FF' : '1px solid transparent',
                          background: contentSource === 'custom' ? 'rgba(0, 102, 255, 0.12)' : 'transparent',
                          color: contentSource === 'custom' ? '#0066FF' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        User Generated Content (UGC)
                      </button>
                    </div>
                  </div>
                )}

                {/* Media Format / Subtype Selector */}
                {(newTaskAction === 'post' || newTaskAction === 'quote_post') && (
                  <div style={{ marginTop: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {newTaskPlatform === 'x' ? 'Post Media Format *' : 'Post Format / Type *'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {newTaskPlatform === 'instagram' ? (
                        [
                          { id: 'image', label: 'Image Post', icon: <ImageIcon size={14} /> },
                          { id: 'video', label: 'Video / Reel', icon: <Film size={14} /> },
                          { id: 'story', label: 'Story Post', icon: <Eye size={14} /> },
                        ].map(fmt => {
                          const isSel = selectedSubtype === fmt.id;
                          return (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => handleSelectSubtype(fmt.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                border: isSel ? '1.5px solid #0066FF' : '1px solid var(--border-subtle)',
                                background: isSel ? 'rgba(0, 102, 255, 0.1)' : 'var(--bg-elevated)',
                                color: isSel ? '#0066FF' : 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {fmt.icon} {fmt.label}
                            </button>
                          );
                        })
                      ) : newTaskPlatform === 'linkedin' ? (
                        [
                          { id: 'text', label: 'Text Only', icon: <Type size={14} /> },
                          { id: 'image', label: 'Image Post', icon: <ImageIcon size={14} /> },
                          { id: 'video', label: 'Video Post', icon: <Film size={14} /> },
                          { id: 'article', label: 'Article / Link', icon: <FileText size={14} /> },
                        ].map(fmt => {
                          const isSel = selectedSubtype === fmt.id;
                          return (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => handleSelectSubtype(fmt.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                border: isSel ? '1.5px solid #0066FF' : '1px solid var(--border-subtle)',
                                background: isSel ? 'rgba(0, 102, 255, 0.1)' : 'var(--bg-elevated)',
                                color: isSel ? '#0066FF' : 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {fmt.icon} {fmt.label}
                            </button>
                          );
                        })
                      ) : (
                        [
                          { id: 'text', label: newTaskPlatform === 'x' ? 'Text Only' : 'Text Post', icon: <Type size={14} /> },
                          { id: 'image', label: 'Image Post', icon: <ImageIcon size={14} /> },
                          { id: 'video', label: 'Video Post', icon: <Film size={14} /> },
                        ].map(fmt => {
                          const isSel = selectedSubtype === fmt.id;
                          return (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => handleSelectSubtype(fmt.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                border: isSel ? '1.5px solid #0066FF' : '1px solid var(--border-subtle)',
                                background: isSel ? 'rgba(0, 102, 255, 0.1)' : 'var(--bg-elevated)',
                                color: isSel ? '#0066FF' : 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {fmt.icon} {fmt.label}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Image Upload Dropzone */}
                    {selectedSubtype === 'image' && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Attach Image Files for Workers to Post *
                          </label>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            PNG, JPG, WEBP (Max 15MB)
                          </span>
                        </div>
                        <input
                          type="file"
                          ref={mediaInputRef}
                          accept="image/*"
                          multiple
                          onChange={(e) => handleMediaSelect(e.target.files)}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => mediaInputRef.current?.click()}
                          style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '10px',
                            border: '2px dashed #0066FF',
                            background: 'rgba(0, 102, 255, 0.04)',
                            color: '#0066FF',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UploadCloud size={18} />
                            <span>Click to Upload Images</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Select image files for creators to download and publish
                          </span>
                        </button>

                        {/* Previews */}
                        {mediaFiles.length > 0 && (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {mediaFiles.map((m) => (
                              <div key={m.id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                                <img src={m.previewUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMediaFile(m.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '3px',
                                    right: '3px',
                                    background: 'rgba(239, 68, 68, 0.9)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <CloseIcon size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video Upload Dropzone */}
                    {selectedSubtype === 'video' && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Attach Video File for Workers to Post / Upload *
                          </label>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            MP4, MOV, WEBM (Max 100MB)
                          </span>
                        </div>
                        <input
                          type="file"
                          ref={mediaInputRef}
                          accept="video/*"
                          multiple
                          onChange={(e) => handleMediaSelect(e.target.files)}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => mediaInputRef.current?.click()}
                          style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '10px',
                            border: '2px dashed #ec4899',
                            background: 'rgba(236, 72, 153, 0.04)',
                            color: '#ec4899',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Film size={18} />
                            <span>Click to Upload Video / Reel</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Select video file for creators to download and publish
                          </span>
                        </button>

                        {/* Video Previews */}
                        {mediaFiles.length > 0 && (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {mediaFiles.map((m) => (
                              <div key={m.id} style={{ position: 'relative', width: '100px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                                <video src={m.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMediaFile(m.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '3px',
                                    right: '3px',
                                    background: 'rgba(239, 68, 68, 0.9)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <CloseIcon size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Story Media Dropzone (Instagram) */}
                    {selectedSubtype === 'story' && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Attach Story Media Assets *
                          </label>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Images / Short Videos
                          </span>
                        </div>
                        <input
                          type="file"
                          ref={mediaInputRef}
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => handleMediaSelect(e.target.files)}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => mediaInputRef.current?.click()}
                          style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '10px',
                            border: '2px dashed #8b5cf6',
                            background: 'rgba(139, 92, 246, 0.04)',
                            color: '#8b5cf6',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UploadCloud size={18} />
                            <span>Click to Upload Story Media</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Select vertical images or video clips for story posts
                          </span>
                        </button>

                        {/* Story Previews */}
                        {mediaFiles.length > 0 && (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {mediaFiles.map((m) => (
                              <div key={m.id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                                {m.type === 'video' ? (
                                  <video src={m.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <img src={m.previewUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMediaFile(m.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '3px',
                                    right: '3px',
                                    background: 'rgba(239, 68, 68, 0.9)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <CloseIcon size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* YouTube Video Post Upload (when platform is youtube and task is post) */}
                {newTaskPlatform === 'youtube' && newTaskAction === 'post' && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Attach YouTube Video File for Workers to Upload *
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        MP4, MOV, WEBM (Max 100MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      ref={mediaInputRef}
                      accept="video/*"
                      multiple
                      onChange={(e) => handleMediaSelect(e.target.files)}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px dashed #ff0000',
                        background: 'rgba(255, 0, 0, 0.04)',
                        color: '#ff0000',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Film size={18} />
                        <span>Click to Upload YouTube Video File</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Select the video file workers must download and upload
                      </span>
                    </button>

                    {/* Previews */}
                    {mediaFiles.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {mediaFiles.map((m) => (
                          <div key={m.id} style={{ position: 'relative', width: '100px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000' }}>
                            <video src={m.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveMediaFile(m.id)}
                              style={{
                                position: 'absolute',
                                top: '3px',
                                right: '3px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <CloseIcon size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Campaign / Task Title */}
              {(() => {
                const titleCfg = getTitleConfig(newTaskPlatform, newTaskAction);
                return (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {titleCfg.label}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={titleCfg.placeholder}
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
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
                );
              })()}

              {/* Target Link */}
              {(() => {
                const targetCfg = getTargetUrlConfig(newTaskPlatform, newTaskAction);
                return (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {targetCfg.label}
                    </label>
                    <input
                      type="url"
                      placeholder={targetCfg.placeholder}
                      value={newTaskLink}
                      onChange={(e) => setNewTaskLink(e.target.value)}
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
                );
              })()}

              {/* Target Reference Screenshot (Prevents Confusion for Like, Upvote, and Engagement Tasks across All Platforms) */}
              {(newTaskAction === 'upvote' || newTaskAction === 'like' || newTaskAction === 'comment_reply') && (
                <div style={{
                  marginBottom: '16px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={15} color="#0066FF" /> Reference Screenshot / Target Image (Optional)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      PNG, JPG, WEBP (Max 15MB)
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Attach a screenshot highlighting or indicating the exact post or comment creators must {newTaskAction === 'upvote' ? 'upvote' : newTaskAction === 'comment_reply' ? 'reply to' : 'like / react to'} to prevent confusion.
                  </p>

                  <input
                    type="file"
                    ref={upvoteImageInputRef}
                    accept="image/*"
                    onChange={(e) => handleMediaSelect(e.target.files)}
                    style={{ display: 'none' }}
                  />

                  {mediaFiles.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => upvoteImageInputRef.current?.click()}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px dashed #0066FF',
                        background: 'rgba(0, 102, 255, 0.04)',
                        color: '#0066FF',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UploadCloud size={18} />
                        <span>Upload Reference Screenshot / Image</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Click to select an image specifying the exact post or comment to {newTaskAction === 'upvote' ? 'upvote' : newTaskAction === 'comment_reply' ? 'reply to' : 'like / react to'}
                      </span>
                    </button>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {mediaFiles.map((m) => (
                          <div key={m.id} style={{ position: 'relative', width: '100px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                            <img src={m.previewUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveMediaFile(m.id)}
                              style={{
                                position: 'absolute',
                                top: '3px',
                                right: '3px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Remove image"
                            >
                              <CloseIcon size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => upvoteImageInputRef.current?.click()}
                        style={{
                          marginTop: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'none',
                          border: 'none',
                          color: '#0066FF',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <UploadCloud size={13} /> Change / Add screenshot
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Reddit Crosspost Destination Link */}
              {newTaskPlatform === 'reddit' && newTaskAction === 'crosspost' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Crosspost Destination Subreddit Link *
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.reddit.com/r/..."
                    value={secondaryUrl}
                    onChange={(e) => setSecondaryUrl(e.target.value)}
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
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Destination subreddit link where creators will submit the crosspost.
                  </p>
                </div>
              )}

              {/* Post / Content Copy Input */}
              {((contentSource === 'provided' && (
                  (newTaskPlatform === 'reddit' && (newTaskAction === 'post' || newTaskAction === 'comment')) ||
                  (newTaskPlatform === 'x' && (newTaskAction === 'post' || newTaskAction === 'comment' || newTaskAction === 'quote_post')) ||
                  (newTaskPlatform === 'quora' && (newTaskAction === 'answer' || newTaskAction === 'comment')) ||
                  (newTaskPlatform === 'linkedin' && (newTaskAction === 'post' || newTaskAction === 'comment'))
                )) ||
                (newTaskPlatform === 'instagram' && (newTaskAction === 'post' || newTaskAction === 'comment')) ||
                (newTaskPlatform === 'youtube' && (newTaskAction === 'comment' || newTaskAction === 'comment_reply'))
              ) && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {newTaskPlatform === 'quora' ? 'Answer Content (Text to be posted) *' :
                     newTaskPlatform === 'x' ? 'Post / Tweet Body Text *' :
                     newTaskPlatform === 'instagram' ? 'Caption / Post Content *' :
                     newTaskPlatform === 'linkedin' ? 'Post Content / Copy *' :
                     newTaskPlatform === 'youtube' ? 'Comment Content *' :
                     'Content / Copy for Creators *'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      newTaskPlatform === 'quora' ? 'Type the exact answer workers should post...' :
                      newTaskPlatform === 'x' ? 'Type the exact tweet content workers must post...' :
                      newTaskPlatform === 'instagram' ? 'Enter the caption or comment text workers should post...' :
                      newTaskPlatform === 'linkedin' ? 'Enter exact LinkedIn post copy...' :
                      'Enter the exact content text workers must post...'
                    }
                    value={postBodyContent}
                    onChange={(e) => setPostBodyContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              )}

              {/* SLOTS FOR LIKE, FOLLOW, SHARE & ENGAGEMENT TASKS; NO SLOTS IN REST OF TASKS (e.g. POST) */}
              {isSlotAction ? (
                <div className="client-form-row-2col">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Number of Slots *
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#0066FF', fontWeight: 600 }}>
                        Worker claims
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      value={newTaskCount}
                      onChange={(e) => setNewTaskCount(e.target.value)}
                      placeholder="e.g. 50 slots"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Creators who will claim a slot to perform this {newTaskAction.replace('_', ' ')}.
                    </p>
                  </div>

                  {/* Locked Budget Card */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Total Budget ($ USD)
                      </label>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Lock size={11} /> Locked Rate
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(59, 130, 246, 0.3)',
                      background: 'rgba(59, 130, 246, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6' }}>
                        ${calculatedBudget.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        ({countVal} slots × ${currentUnitRate.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Rest of the tasks (e.g. Post): NO slots input! */
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Total Campaign Budget ($ USD)
                    </label>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={11} /> Locked Rate
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6' }}>
                      ${calculatedBudget.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Single campaign task
                    </span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Guidelines & Requirements for Creators
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewTaskInstructions(getDefaultPlatformGuidelines(newTaskPlatform, newTaskAction, contentSource, selectedSubtype))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0066FF',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      transition: 'background 0.15s ease'
                    }}
                    title="Auto-fill recommended guidelines"
                  >
                    <Sparkles size={12} /> Auto-fill Guidelines
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder={getDefaultPlatformGuidelines(newTaskPlatform, newTaskAction, contentSource, selectedSubtype)}
                  value={newTaskInstructions}
                  onChange={(e) => setNewTaskInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.5
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ marginRight: 'auto', fontSize: '12px', color: walletBalance < calculatedBudget ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
                  Wallet Balance: ${(walletBalance).toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateTaskOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCampaign || isUploadingMedia}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSubmittingCampaign || isUploadingMedia ? '#93c5fd' : '#0066FF',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSubmittingCampaign || isUploadingMedia ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)'
                  }}
                >
                  {isSubmittingCampaign || isUploadingMedia ? 'Uploading & Submitting...' : `Submit for Review ($${calculatedBudget.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TOP UP WALLET (CONTACT ADMIN) */}
      {/* ======================================================== */}
      {isTopUpOpen && (
        <div className="client-modal-backdrop">
          <div className="client-modal-card-sm" style={{ maxWidth: '440px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Top Up Wallet
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                  Contact our admin directly to add funds to your wallet.
                </p>
              </div>
              <button
                onClick={() => setIsTopUpOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                To load funds into your wallet, please message our admin directly on <strong>WhatsApp</strong> or <strong>Telegram</strong> with your account email and desired deposit amount.
              </div>

              {/* 1. WhatsApp Contact Card */}
              <a
                href={ADMIN_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(37, 211, 102, 0.08)',
                  border: '1.5px solid rgba(37, 211, 102, 0.35)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(37, 211, 102, 0.35)'
                  }}>
                    <WhatsAppIcon size={24} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      WhatsApp Admin
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', marginTop: '1px' }}>
                      {ADMIN_WHATSAPP_PHONE}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#25D366',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)'
                }}>
                  <span>Chat</span>
                  <ExternalLink size={13} strokeWidth={2.5} />
                </div>
              </a>

              {/* 2. Telegram Contact Card */}
              <a
                href={ADMIN_TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(36, 161, 222, 0.08)',
                  border: '1.5px solid rgba(36, 161, 222, 0.35)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#24A1DE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(36, 161, 222, 0.35)'
                  }}>
                    <TelegramIcon size={24} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Telegram Admin
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0284c7', marginTop: '1px' }}>
                      {ADMIN_TELEGRAM_HANDLE}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#24A1DE',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(36, 161, 222, 0.25)'
                }}>
                  <span>Message</span>
                  <ExternalLink size={13} strokeWidth={2.5} />
                </div>
              </a>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 102, 255, 0.06)',
                border: '1px solid rgba(0, 102, 255, 0.15)',
                fontSize: '11.5px',
                color: 'var(--text-secondary)'
              }}>
                <CheckCircle2 size={16} color="#0066FF" style={{ flexShrink: 0 }} />
                <span>
                  Supported payment methods: <strong>UPI, Bank Transfer, Card & Crypto</strong>.
                </span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsTopUpOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

