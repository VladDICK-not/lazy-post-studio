/**
 * Helpers for formatting text for Telegram and Threads.
 */

/**
 * Converts rich HTML from TipTap into Telegram Bot API compatible HTML format.
 * Telegram supports: <b>, <strong>, <i>, <em>, <u>, <s>, <a href="...">, <code>, <pre>, <blockquote>
 */
export function formatForTelegram(html: string): string {
  if (!html) return '';

  let text = html;

  // Handle headers: wrap content in <b> and append newlines
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '<b>$1</b>\n\n');

  // Handle blockquotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '<blockquote>$1</blockquote>\n\n');

  // Handle lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n');
  text = text.replace(/<\/(ul|ol)>/gi, '\n');
  text = text.replace(/<(ul|ol)[^>]*>/gi, '');

  // Handle paragraphs and line breaks
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');

  // Preserve supported tags: <b>, <i>, <u>, <s>, <a>, <code>, <pre>, <blockquote>
  // Clean other unsupported HTML tags
  text = text.replace(/<(?!\/?(b|strong|i|em|u|ins|s|strike|del|a\s|code|pre|blockquote)\b)[^>]+>/gi, '');

  // Normalize multiple newlines (at most 2 consecutive newlines)
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Strips HTML tags and returns clean plain text formatted for Threads.
 * Preserves links from <a href="URL">text</a> by outputting "text (URL)" if they differ.
 */
export function formatForThreads(html: string): string {
  if (!html) return '';

  let text = html;

  // Format links nicely: "Title (https://...)" or just "https://..." if text is identical
  text = text.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_, href, anchorText) => {
    const cleanAnchor = anchorText.replace(/<[^>]+>/g, '').trim();
    if (!cleanAnchor || cleanAnchor === href) return href;
    return `${cleanAnchor} (${href})`;
  });

  // Handle list items
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n');

  // Handle paragraphs and breaks
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace and newlines
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Get character count of text (Threads limit is 500)
 */
export function getCharacterCount(text: string): number {
  return text ? text.length : 0;
}
