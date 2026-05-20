const BLOCKED_TAGS_REGEX =
  /<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta)[^>]*>/gi;
const BLOCKED_TAGS_WITH_CONTENT_REGEX =
  /<(script|style|iframe|object|embed|form|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi;

export function sanitizeProductRichText(html: string) {
  return html
    .replace(BLOCKED_TAGS_WITH_CONTENT_REGEX, "")
    .replace(BLOCKED_TAGS_REGEX, "")
    .replace(/\s(on\w+)=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)=("|')\s*javascript:[^"']*\2/gi, "");
}

export function stripProductRichText(html: string) {
  return html
    .replace(BLOCKED_TAGS_WITH_CONTENT_REGEX, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
