/**
 * Utilities for multi-comment tasks
 */

/**
 * Parses a task's content_body into an array of comment strings.
 * Supports both JSON arrays and legacy plain text comments.
 */
export function parseCommentItems(contentBody: string | null | undefined): string[] {
  if (!contentBody) return [];
  const trimmed = contentBody.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) => (typeof item === 'string' ? item : JSON.stringify(item)))
          .filter((item: string) => item.trim().length > 0);
      }
    } catch {
      // Not valid JSON, fall back to plain text
    }
  }

  return [trimmed];
}

/**
 * Checks if a task has multiple comments configured in content_body.
 */
export function isMultiCommentTask(task: {
  task_type?: string;
  content_mode?: string;
  content_body?: string | null;
}): boolean {
  if (!task || !task.content_body) return false;
  const isCommentType = task.task_type === 'comment' || task.task_type === 'comment_reply';
  if (!isCommentType) return false;
  
  const comments = parseCommentItems(task.content_body);
  return comments.length > 1 || (task.content_body.trim().startsWith('[') && comments.length > 0);
}

/**
 * Serializes an array of comment strings into a JSON array for database storage.
 */
export function serializeCommentItems(comments: string[]): string {
  const clean = comments.map(c => c.trim()).filter(c => c.length > 0);
  if (clean.length === 0) return '';
  return JSON.stringify(clean);
}

/**
 * Resolves the specific assigned comment text for a claim.
 */
export function getAssignedCommentText(
  contentBody: string | null | undefined,
  assignedIndex?: number | null
): string {
  if (!contentBody) return '';
  const comments = parseCommentItems(contentBody);
  if (comments.length === 0) return contentBody;

  if (assignedIndex !== null && assignedIndex !== undefined && assignedIndex >= 0 && assignedIndex < comments.length) {
    return comments[assignedIndex];
  }

  // Fallback to first comment if single item or fallback to raw content_body
  return comments[0] || contentBody;
}
