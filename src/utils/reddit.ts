/**
 * Extracts a clean Reddit username from a profile URL.
 * It handles query parameters, hash fragments, and trailing slashes.
 */
export function getRedditUsername(link: string | null | undefined): string {
  if (!link) return 'Reddit Account';
  
  try {
    // 1. Strip query parameters and hash fragments (e.g. ?utm_source=... or #tag)
    const cleanLink = link.split('?')[0].split('#')[0].trim();
    
    // 2. Extract username from standard Reddit URL patterns:
    //    - reddit.com/user/username
    //    - reddit.com/u/username
    const match = cleanLink.match(/(?:reddit\.com\/)(?:user|u)\/([a-zA-Z0-9_\-]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    
    // 3. Fallback: remove trailing slashes and split by '/'
    const parts = cleanLink.replace(/\/$/, '').split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart || 'Reddit Account';
  } catch (error) {
    return 'Reddit Account';
  }
}

/**
 * Cleans and normalizes a Reddit profile URL to a standard format:
 * https://www.reddit.com/u/username
 */
export function normalizeRedditProfileLink(link: string): string {
  const username = getRedditUsername(link);
  if (username && username !== 'Reddit Account') {
    return `https://www.reddit.com/u/${username}`;
  }
  return link;
}
