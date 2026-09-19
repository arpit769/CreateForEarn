import React from 'react';

export type LinkedInTaskType = 'post' | 'comment' | 'like' | 'repost' | 'follow' | 'connect' | 'share';
export type LinkedInPostType = 'text' | 'image' | 'video' | 'article_link';
export type LinkedInContentSource = 'admin_provided' | 'ugc';
export type LinkedInReactionType = 'like' | 'celebrate' | 'support' | 'love' | 'insightful' | 'funny';
export type LinkedInRepostType = 'repost' | 'repost_with_thoughts';
export type LinkedInShareMethod = 'share_on_linkedin' | 'send_privately';

export interface LinkedInAccount {
  id: string;
  user_id: string;
  username: string;
  profile_url: string;
  headline?: string | null;
  connections_count?: number;
  status: 'pending_details' | 'pending_approval' | 'verified' | 'rejected' | 'banned';
  rejection_reason?: string | null;
  ban_reason?: string | null;
  created_at: string;
}

export const LINKEDIN_TASK_TYPES: { type: LinkedInTaskType; label: string; desc: string }[] = [
  { type: 'post', label: 'Post', desc: 'Publish a new post (Text, Image, Video, or Article)' },
  { type: 'comment', label: 'Comment', desc: 'Comment on a target LinkedIn post' },
  { type: 'like', label: 'Like / Reaction', desc: 'React (Like, Celebrate, Support, Love, Insightful, Funny)' },
  { type: 'repost', label: 'Repost', desc: 'Instant Repost or Repost with your thoughts' },
  { type: 'follow', label: 'Follow', desc: 'Follow a LinkedIn page or profile' },
  { type: 'connect', label: 'Connect', desc: 'Send a connection request to a LinkedIn profile' },
  { type: 'share', label: 'Share', desc: 'Share post on LinkedIn or send privately' },
];

export const LINKEDIN_POST_TYPES: { type: LinkedInPostType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'article_link', label: 'Article / Link' },
];

export const LINKEDIN_REACTION_OPTIONS: { type: LinkedInReactionType; label: string; icon: string; color: string }[] = [
  { type: 'like', label: 'Like', icon: '👍', color: '#0A66C2' },
  { type: 'celebrate', label: 'Celebrate', icon: '👏', color: '#44712E' },
  { type: 'support', label: 'Support', icon: '🤝', color: '#8F5849' },
  { type: 'love', label: 'Love', icon: '❤️', color: '#C04337' },
  { type: 'insightful', label: 'Insightful', icon: '💡', color: '#B27600' },
  { type: 'funny', label: 'Funny', icon: '😄', color: '#557689' },
];

export const LINKEDIN_REPOST_OPTIONS: { type: LinkedInRepostType; label: string; desc: string }[] = [
  { type: 'repost', label: 'Instant Repost', desc: 'Repost immediately to your feed' },
  { type: 'repost_with_thoughts', label: 'Repost with your thoughts', desc: 'Repost with custom commentary' },
];

export const LINKEDIN_SHARE_OPTIONS: { type: LinkedInShareMethod; label: string }[] = [
  { type: 'share_on_linkedin', label: 'Share on LinkedIn' },
  { type: 'send_privately', label: 'Send Privately' },
];

export function getDefaultLinkedInInstructions(
  type: LinkedInTaskType = 'post',
  postType: LinkedInPostType = 'text',
  contentSource: LinkedInContentSource = 'admin_provided',
  reactionType: LinkedInReactionType = 'like',
  repostType: LinkedInRepostType = 'repost',
  shareMethod: LinkedInShareMethod = 'share_on_linkedin'
): string {
  switch (type) {
    case 'post':
      if (contentSource === 'admin_provided') {
        if (postType === 'image' || postType === 'video') {
          return '1. Copy the provided post caption and download/attach the provided media.\n2. Publish it as a public post on your active, verified LinkedIn profile.\n3. Make sure post visibility is set to "Anyone".\n4. Submit your live LinkedIn post URL and a screenshot of the published post as proof.';
        } else if (postType === 'article_link') {
          return '1. Copy the provided post text and include the target article link.\n2. Publish it as a public post on your active, verified LinkedIn profile (visibility set to "Anyone").\n3. Submit your live LinkedIn post URL and a screenshot of the published post as proof.';
        } else {
          return '1. Copy the provided post text exactly as given.\n2. Publish it as a public post on your active, verified LinkedIn profile (visibility set to "Anyone").\n3. Submit your live LinkedIn post URL and a screenshot of the published post as proof.';
        }
      } else {
        return '1. Write an engaging, professional post based on the requested guidelines/topic.\n2. Publish it publicly on your active, verified LinkedIn profile (visibility set to "Anyone").\n3. Submit your live LinkedIn post URL and a screenshot of the published post as proof.';
      }

    case 'comment':
      if (contentSource === 'admin_provided') {
        return '1. Open the target LinkedIn post link.\n2. Post the provided comment text exactly as given using your active, verified LinkedIn profile.\n3. Ensure your comment is visible.\n4. Submit the URL to your comment/post and a clear screenshot showing your posted comment.';
      } else {
        return '1. Open the target LinkedIn post link.\n2. Read the post and leave a thoughtful, professional, and context-relevant comment (at least 15-20 words).\n3. Submit the URL to your comment/post and a clear screenshot showing your posted comment.';
      }

    case 'like': {
      const reactLabel = reactionType ? reactionType.charAt(0).toUpperCase() + reactionType.slice(1) : 'Like';
      return `1. Open the target LinkedIn post link.\n2. React to the post with "${reactLabel}" using your active, verified LinkedIn profile.\n3. Take a clear screenshot showing your active reaction on the post.\n4. Upload the screenshot as proof.`;
    }

    case 'repost':
      if (repostType === 'repost_with_thoughts') {
        return '1. Open the target LinkedIn post link.\n2. Click "Repost with your thoughts".\n3. Add a thoughtful, insightful comment relevant to the topic, then publish.\n4. Submit your published repost URL and a screenshot showing the repost on your profile.';
      } else {
        return '1. Open the target LinkedIn post link.\n2. Click "Repost" (Instant Repost) to share it directly to your LinkedIn feed.\n3. Take a clear screenshot of the post showing the "Reposted" indicator or your feed.\n4. Submit your post/profile URL and screenshot as proof.';
      }

    case 'follow':
      return '1. Open the target LinkedIn Company Page / Creator profile link.\n2. Click the "+ Follow" button using your active, verified LinkedIn account.\n3. Ensure the button status changes to "Following".\n4. Take a clear screenshot showing "Following" and upload it as proof.';

    case 'connect':
      return '1. Open the target LinkedIn profile link.\n2. Click "Connect" (or "More" -> "Connect") using your active, verified LinkedIn account.\n3. Send the connection request (include personalized note if specified).\n4. Take a screenshot showing the sent / pending connection request and upload it as proof.';

    case 'share':
      if (shareMethod === 'send_privately') {
        return '1. Open the target LinkedIn post link.\n2. Click "Send" (Send as message) and share the post privately as instructed.\n3. Take a clear screenshot showing the sent message confirmation.\n4. Upload the screenshot as proof.';
      } else {
        return '1. Open the target LinkedIn post link.\n2. Click "Share" and post/share it with your LinkedIn network.\n3. Take a clear screenshot showing the shared post.\n4. Submit the post link and upload the screenshot proof.';
      }

    default:
      return '1. Open the target LinkedIn link.\n2. Complete the required action using your active, verified LinkedIn account.\n3. Upload screenshot proof of completion.';
  }
}

export function getDefaultLinkedInPayment(type: LinkedInTaskType): string {
  switch (type) {
    case 'post': return '0.50';
    case 'comment': return '0.20';
    case 'like': return '0.05';
    case 'repost': return '0.20';
    case 'follow': return '0.10';
    case 'connect': return '0.15';
    case 'share': return '0.15';
    default: return '0.20';
  }
}

/**
 * Extracts clean LinkedIn username or profile slug from link or input.
 */
export function extractLinkedInUsername(input: string): string {
  let cleaned = input.trim();
  // Remove query params and trailing slashes
  cleaned = cleaned.split('?')[0].split('#')[0].replace(/\/+$/, '');
  
  // Try matching standard LinkedIn profile URL patterns: linkedin.com/in/username
  const inMatch = cleaned.match(/(?:linkedin\.com\/(?:in|company)\/)([a-zA-Z0-9_\-]+)/i);
  if (inMatch) {
    return inMatch[1];
  }

  // Remove leading in/ or @
  cleaned = cleaned.replace(/^(?:in\/|@)/, '');
  
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || cleaned;
}

/**
 * Cleans and standardizes LinkedIn profile URL
 */
export function cleanLinkedInUrl(input: string): string {
  const username = extractLinkedInUsername(input);
  if (!username) return input.trim();
  return `https://www.linkedin.com/in/${username}`;
}

/**
 * Returns formatted handle with 'in/' prefix
 */
export function formatLinkedInHandle(usernameOrUrl: string): string {
  const username = extractLinkedInUsername(usernameOrUrl);
  return `in/${username}`;
}

/**
 * Official LinkedIn brand SVG icon (Filled with #0A66C2 by default)
 */
export function LinkedInIcon({ size = 20, color = '#0A66C2', className, style }: { size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: color,
      className,
      style: { display: 'inline-block', flexShrink: 0, ...style }
    },
    React.createElement('path', {
      d: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.85 18.5V10.13H5.06V18.5h2.79z'
    })
  );
}

/**
 * Clean LinkedIn Monogram SVG for nav / small badges
 */
export function LinkedInNavIcon({ size = 16, color = '#0A66C2', className, style }: { size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: color,
      className,
      style: { display: 'inline-block', flexShrink: 0, ...style }
    },
    React.createElement('path', {
      d: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.85 18.5V10.13H5.06V18.5h2.79z'
    })
  );
}


