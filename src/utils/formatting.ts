/**
 * Display Formatting Utilities
 */

export function formatTime(isoOrDateString?: string): string {
  if (!isoOrDateString) return '--:--';
  try {
    const date = new Date(isoOrDateString);
    if (isNaN(date.getTime())) return isoOrDateString;
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoOrDateString;
  }
}

export function formatTimeWithSeconds(isoOrDateString?: string): string {
  if (!isoOrDateString) return '--:--:--';
  try {
    const date = new Date(isoOrDateString);
    if (isNaN(date.getTime())) return isoOrDateString;
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return isoOrDateString;
  }
}

export function formatDate(isoOrDateString?: string): string {
  if (!isoOrDateString) return '';
  try {
    const date = new Date(isoOrDateString);
    if (isNaN(date.getTime())) return isoOrDateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoOrDateString;
  }
}

export function truncateToken(token: string, head = 6, tail = 6): string {
  if (!token) return '';
  if (token.length <= head + tail + 3) return token;
  return `${token.slice(0, head)}...${token.slice(-tail)}`;
}
