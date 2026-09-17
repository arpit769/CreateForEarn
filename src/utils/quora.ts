/**
 * Utility functions for Quora profiles and URLs
 */

export function extractQuoraUsername(input: string | null | undefined): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. If it's a URL
  try {
    const cleanLink = trimmed.split('?')[0].split('#')[0].replace(/\/$/, '');
    
    // Check for quora.com/profile/Username
    const profileMatch = cleanLink.match(/(?:quora\.com\/profile\/)([^/?#]+)/i);
    if (profileMatch && profileMatch[1]) {
      return decodeURIComponent(profileMatch[1]).replace(/^@/, '');
    }

    // Check for quora.com/Username
    const directMatch = cleanLink.match(/(?:quora\.com\/)([^/?#]+)/i);
    if (directMatch && directMatch[1] && !['about', 'contact', 'careers', 'press', 'terms', 'privacy', 'topic', 'q', 'unanswered'].includes(directMatch[1].toLowerCase())) {
      return decodeURIComponent(directMatch[1]).replace(/^@/, '');
    }

    // Fallback if URL
    if (cleanLink.includes('/')) {
      const parts = cleanLink.split('/');
      const last = parts[parts.length - 1];
      if (last) return decodeURIComponent(last).replace(/^@/, '');
    }
  } catch (err) {
    // Ignore and proceed to raw string processing
  }

  // 2. If it's just @username or username
  return trimmed.replace(/^@/, '').trim();
}

export function getQuoraUsername(urlOrUsername: string | null | undefined): string {
  const username = extractQuoraUsername(urlOrUsername);
  return username || 'Quora Account';
}

export function normalizeQuoraProfileUrl(input: string): string {
  const username = extractQuoraUsername(input);
  if (username && username !== 'Quora Account') {
    return `https://www.quora.com/profile/${encodeURIComponent(username)}`;
  }
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return `https://${input}`;
  }
  return input;
}
