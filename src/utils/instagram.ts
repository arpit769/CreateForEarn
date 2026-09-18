import React from 'react';

/**
 * Utility functions for Instagram profiles and URLs
 */

export function extractInstagramUsername(input: string | null | undefined): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. If it's a URL
  try {
    const cleanLink = trimmed.split('?')[0].split('#')[0].replace(/\/$/, '');
    
    // Check for instagram.com/username
    const profileMatch = cleanLink.match(/(?:instagram\.com\/)([^/?#]+)/i);
    if (profileMatch && profileMatch[1] && !['about', 'explore', 'reels', 'stories', 'p', 'direct', 'accounts', 'developer'].includes(profileMatch[1].toLowerCase())) {
      return decodeURIComponent(profileMatch[1]).replace(/^@/, '');
    }

    // Fallback if URL
    if (cleanLink.includes('/')) {
      const parts = cleanLink.split('/');
      const last = parts[parts.length - 1];
      if (last && !['about', 'explore', 'reels', 'stories', 'p', 'direct', 'accounts'].includes(last.toLowerCase())) {
        return decodeURIComponent(last).replace(/^@/, '');
      }
    }
  } catch (err) {
    // Ignore and proceed to raw string processing
  }

  // 2. If it's just @username or username
  return trimmed.replace(/^@/, '').trim();
}

export function getInstagramUsername(urlOrUsername: string | null | undefined): string {
  const username = extractInstagramUsername(urlOrUsername);
  return username || 'Instagram Account';
}

export function normalizeInstagramProfileUrl(input: string): string {
  const username = extractInstagramUsername(input);
  if (username && username !== 'Instagram Account') {
    return `https://www.instagram.com/${encodeURIComponent(username)}`;
  }
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return `https://${input}`;
  }
  return input;
}

export const INSTAGRAM_TASK_TYPES = [
  { key: 'all', label: 'All Tasks' },
  { key: 'post', label: 'Posts' },
  { key: 'comment', label: 'Comments' },
  { key: 'like', label: 'Likes' },
  { key: 'follow', label: 'Follow Profile' },
  { key: 'save', label: 'Saves' },
  { key: 'reel_view', label: 'Reel Views' },
  { key: 'story_view', label: 'Story Views' },
] as const;

export function InstagramIcon({ 
  size = 18, 
  color = '#E1306C', 
  className, 
  style 
}: { 
  size?: number; 
  color?: string; 
  className?: string; 
  style?: React.CSSProperties;
}) {
  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className,
      style: { display: 'inline-block', flexShrink: 0, ...style }
    },
    React.createElement('rect', { x: 2, y: 2, width: 20, height: 20, rx: 5, ry: 5 }),
    React.createElement('path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }),
    React.createElement('line', { x1: 17.5, y1: 6.5, x2: 17.51, y2: 6.5 })
  );
}

export function getDefaultInstagramInstructions(
  type: string, 
  subtype: 'image' | 'video' = 'image', 
  mode: 'provided' | 'custom' = 'provided'
): string {
  switch (type) {
    case 'post':
      if (subtype === 'video') {
        if (mode === 'provided') {
          return '1. Download the provided reel video and copy the provided caption.\n2. Upload it as an Instagram Reel using your active verified Instagram account.\n3. Make sure the reel is public and visible.\n4. Submit your live Instagram Reel URL and a screenshot of the published reel as proof.';
        } else {
          return '1. Create a high-quality, engaging video Reel relevant to the topic described.\n2. Publish it publicly on your active verified Instagram profile.\n3. Submit your live Instagram Reel URL and a screenshot of the published reel as proof.';
        }
      } else {
        if (mode === 'provided') {
          return '1. Copy the provided caption and use the provided image/media.\n2. Publish it as a feed post on your active verified Instagram account.\n3. Ensure the post is public and visible.\n4. Submit your live Instagram post URL and a screenshot of the published post as proof.';
        } else {
          return '1. Create a relevant, high-quality image post based on the requested guidelines.\n2. Publish it publicly on your active verified Instagram profile.\n3. Submit your live Instagram post URL and a screenshot of the published post as proof.';
        }
      }
    case 'comment':
      if (mode === 'provided') {
        return '1. Open the target Instagram Post / Reel link.\n2. Post the provided comment text exactly as given using your active verified Instagram account.\n3. Ensure your comment is visible.\n4. Submit the direct link to your comment (or post URL) and upload a screenshot showing your posted comment.';
      } else {
        return '1. Open the target Instagram Post / Reel link.\n2. Write and post a genuine, thoughtful, and context-relevant comment using your active verified Instagram account (minimum 8-10 words).\n3. Submit your comment link / post URL and upload a screenshot showing your posted comment.';
      }
    case 'like':
      return '1. Open the target Instagram Post / Reel link.\n2. Like the post (tap the heart icon) using your active verified Instagram account.\n3. Take a clear screenshot showing the liked post (with the red heart active).\n4. Upload the screenshot as proof.';
    case 'follow':
      return '1. Open the target Instagram profile URL.\n2. Follow the account using your active verified Instagram account.\n3. Ensure the follow status displays "Following".\n4. Take a clear screenshot of the profile showing "Following" and upload it as proof.';
    case 'save':
      return '1. Open the target Instagram Post / Reel link.\n2. Tap the bookmark / save icon to save the post to your Instagram collection.\n3. Take a screenshot showing the post saved (bookmark icon highlighted or saved banner).\n4. Upload the screenshot as proof.';
    case 'reel_view':
      return '1. Open the target Instagram Reel link.\n2. Watch the Reel completely from start to finish.\n3. Take a screenshot during/after watching the reel.\n4. Upload the screenshot as proof.';
    case 'story_view':
      return '1. Open the target Instagram profile / story link.\n2. View all active stories completely.\n3. Take a screenshot showing you viewed the story.\n4. Upload the screenshot as proof.';
    default:
      return '1. Open the target Instagram link.\n2. Perform the required action using your active verified Instagram account.\n3. Upload screenshot proof of completion.';
  }
}

export function getDefaultInstagramPayment(type: string): string {
  switch (type) {
    case 'post': return '0.50';
    case 'comment': return '0.20';
    case 'like': return '0.05';
    case 'follow': return '0.10';
    case 'save': return '0.05';
    case 'reel_view': return '0.05';
    case 'story_view': return '0.05';
    default: return '0.20';
  }
}


