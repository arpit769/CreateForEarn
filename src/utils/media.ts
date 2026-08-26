export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

/**
 * Checks whether a given URL or filename points to a video file.
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.mkv') ||
    cleanUrl.endsWith('.avi') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.includes('/video/') ||
    cleanUrl.includes('youtube.com') ||
    cleanUrl.includes('youtu.be')
  );
}

/**
 * Parses raw image_url string from DB (which can be a single URL, a JSON array of URLs,
 * or newline/comma separated URLs) into a structured array of MediaItems.
 */
export function parseMediaItems(
  rawUrl: string | null | undefined,
  contentMode?: string
): MediaItem[] {
  if (!rawUrl || typeof rawUrl !== 'string') return [];
  const trimmed = rawUrl.trim();
  if (!trimmed) return [];

  let urls: string[] = [];

  // Check if it's a JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        urls = parsed
          .map((item) => (typeof item === 'string' ? item.trim() : item?.url || ''))
          .filter(Boolean);
      }
    } catch {
      // If JSON parse fails, fall through
    }
  }

  // If not parsed as JSON array, check newline/comma or treat as single URL
  if (urls.length === 0) {
    if (trimmed.includes('\n')) {
      urls = trimmed
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
    } else if (trimmed.includes(',') && !trimmed.startsWith('http')) {
      urls = trimmed
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
    } else {
      urls = [trimmed];
    }
  }

  return urls.map((url) => {
    const isVid = contentMode === 'video' || isVideoUrl(url);
    return {
      url,
      type: isVid ? 'video' : 'image',
    };
  });
}

/**
 * Serializes an array of URLs into a single string for storage.
 * If 1 item, stores as single string for backward compatibility.
 * If multiple items, stores as JSON array string.
 */
export function serializeMediaUrls(urls: string[]): string {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}

/**
 * Helper to download a media file via browser fetch/blob.
 */
export async function downloadMediaAsset(url: string, filename?: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    
    // Determine filename
    let finalName = filename;
    if (!finalName) {
      const parts = url.split('/');
      finalName = parts[parts.length - 1].split('?')[0] || 'media-asset';
    }
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback direct open in new window
    window.open(url, '_blank');
  }
}
