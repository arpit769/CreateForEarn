import React from 'react';

/**
 * Utility functions for Facebook profiles, URLs, and task configurations
 */

export function extractFacebookUsername(input: string | null | undefined): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  try {
    const cleanLink = trimmed.split('?')[0].split('#')[0].replace(/\/$/, '');

    // Check for facebook.com/username or fb.com/username
    const profileMatch = cleanLink.match(/(?:facebook\.com|fb\.com)\/(?:profile\.php\?id=([0-9]+)|([a-zA-Z0-9._-]+))/i);
    if (profileMatch) {
      const match = profileMatch[1] || profileMatch[2];
      if (match && !['watch', 'groups', 'pages', 'share', 'events', 'marketplace', 'gaming', 'login', 'recover'].includes(match.toLowerCase())) {
        return decodeURIComponent(match).replace(/^@/, '');
      }
    }

    if (cleanLink.includes('/')) {
      const parts = cleanLink.split('/');
      const last = parts[parts.length - 1];
      if (last && !['watch', 'groups', 'pages', 'share', 'events'].includes(last.toLowerCase())) {
        return decodeURIComponent(last).replace(/^@/, '');
      }
    }
  } catch (err) {
    // Ignore and proceed
  }

  return trimmed.replace(/^@/, '').trim();
}

export function getFacebookUsername(urlOrUsername: string | null | undefined): string {
  const username = extractFacebookUsername(urlOrUsername);
  return username || 'Facebook Account';
}

export function normalizeFacebookProfileUrl(input: string): string {
  const username = extractFacebookUsername(input);
  if (username && username !== 'Facebook Account') {
    if (/^[0-9]+$/.test(username)) {
      return `https://www.facebook.com/profile.php?id=${username}`;
    }
    return `https://www.facebook.com/${encodeURIComponent(username)}`;
  }
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return `https://${input}`;
  }
  return input;
}

export const FACEBOOK_TASK_TYPES = [
  { key: 'all', label: 'All Tasks' },
  { key: 'post', label: 'Post' },
  { key: 'comment', label: 'Comment' },
  { key: 'like', label: 'Like / Reaction' },
  { key: 'share', label: 'Share' },
  { key: 'follow', label: 'Follow / Like Page' },
  { key: 'join_group', label: 'Join Group' },
  { key: 'story_view', label: 'Story View' },
] as const;

export const FACEBOOK_POST_TYPES = [
  { key: 'text', label: 'Text' },
  { key: 'image', label: 'Image' },
  { key: 'video', label: 'Video' },
  { key: 'link', label: 'Link' },
] as const;

export const FACEBOOK_REACTION_TYPES = [
  { key: 'like', label: 'Like', icon: '👍' },
  { key: 'love', label: 'Love', icon: '❤️' },
  { key: 'care', label: 'Care', icon: '🥰' },
  { key: 'haha', label: 'Haha', icon: '😆' },
  { key: 'wow', label: 'Wow', icon: '😮' },
  { key: 'sad', label: 'Sad', icon: '😢' },
  { key: 'angry', label: 'Angry', icon: '😡' },
] as const;

export const FACEBOOK_SHARE_TYPES = [
  { key: 'feed', label: 'Share to Feed' },
  { key: 'group', label: 'Share to Group' },
  { key: 'story', label: 'Share to Story' },
] as const;

export const FACEBOOK_FOLLOW_ACTIONS = [
  { key: 'follow', label: 'Follow' },
  { key: 'like_page', label: 'Like Page' },
] as const;

export function FacebookIcon({ 
  size = 18, 
  color = '#1877F2', 
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
      fill: color,
      className,
      style: { display: 'inline-block', flexShrink: 0, ...style }
    },
    React.createElement('path', {
      d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
    })
  );
}

export function getDefaultFacebookInstructions(
  type: string, 
  subtype = 'text', 
  mode: 'provided' | 'custom' = 'provided'
): string {
  switch (type) {
    case 'post':
      if (mode === 'provided') {
        if (subtype === 'image') {
          return '1. Copy the provided text content and download the attached image(s).\n2. Publish a public post on the target Facebook Page/Group/Profile.\n3. Make sure the post visibility is set to Public.\n4. Submit your published post URL and upload a screenshot showing your live post as proof.';
        } else if (subtype === 'video') {
          return '1. Copy the provided caption and download the attached video.\n2. Publish it as a public video post on the target Facebook Page/Group/Profile.\n3. Submit your published video URL and upload a screenshot as proof.';
        } else if (subtype === 'link') {
          return '1. Copy the provided link and post content.\n2. Create a new public post sharing the link on the target Facebook Page/Group/Profile.\n3. Submit your published post link and a screenshot as proof.';
        } else {
          return '1. Copy the provided text content exactly as given.\n2. Publish it as a public post on the target Facebook Page/Group/Profile.\n3. Submit the live post link and a screenshot as proof.';
        }
      } else {
        return '1. Create a relevant, high-quality, genuine post according to the instructions provided.\n2. Publish the post publicly on the target Facebook Page/Group/Profile.\n3. Submit the live post link and upload a screenshot as proof.';
      }

    case 'comment':
      if (mode === 'provided') {
        return '1. Open the target Facebook post link.\n2. Post the provided comment text exactly as written using your active verified Facebook account.\n3. Ensure your comment is publicly visible.\n4. Submit your direct comment link or post link, along with a screenshot showing your posted comment.';
      } else {
        return '1. Open the target Facebook post link.\n2. Write and post a thoughtful, engaging comment relevant to the post content (minimum 8-10 words).\n3. Submit your comment/post link and upload a screenshot showing your comment.';
      }

    case 'like':
      return '1. Open the target Facebook post link.\n2. React to the post with the required reaction using your active verified Facebook account.\n3. Take a clear screenshot showing your reaction active on the post.\n4. Upload the screenshot as proof.';

    case 'share':
      return '1. Open the target Facebook post link.\n2. Click "Share" and choose the requested share destination (Feed, Group, or Story).\n3. Ensure the shared post is visible.\n4. Take a clear screenshot of your shared post and submit the post link / screenshot as proof.';

    case 'follow':
      return '1. Open the target Facebook Page/Profile URL.\n2. Click the Follow or Like Page button as specified.\n3. Ensure the button status displays "Following" or "Liked".\n4. Take a clear screenshot of the page showing the following status and upload it as proof.';

    case 'join_group':
      return '1. Open the target Facebook Group URL.\n2. Click "Join Group" and complete any quick admission questions if prompted.\n3. Ensure you have joined or requested to join.\n4. Take a screenshot showing you joined the group and upload it as proof.';

    case 'story_view':
      return '1. Open the target Facebook Story/Profile URL.\n2. View the active story completely from start to finish.\n3. Take a screenshot showing you viewed the story.\n4. Upload the screenshot as proof.';

    default:
      return '1. Open the target Facebook link.\n2. Complete the required action using your active verified Facebook account.\n3. Upload screenshot proof of completion.';
  }
}

export function getDefaultFacebookPayment(type: string): string {
  switch (type) {
    case 'post': return '0.50';
    case 'comment': return '0.20';
    case 'like': return '0.05';
    case 'share': return '0.25';
    case 'follow': return '0.10';
    case 'join_group': return '0.15';
    case 'story_view': return '0.05';
    default: return '0.20';
  }
}
