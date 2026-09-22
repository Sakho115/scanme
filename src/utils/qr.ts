/**
 * QR Token Extraction Utility
 * 
 * Resiliently extracts participant credentials from:
 * 1. Raw 64-character hexadecimal participant token
 * 2. Pass IDs (e.g. VYG26-00045, VYG26-00001)
 * 3. Full URL with query parameters (e.g. ?token=4c2c6c..., ?pass=VYG26-00045, ?id=...)
 * 4. Full URL with path segment (e.g. /pass/4c2c6c..., /verify/VYG26-00045)
 * 5. Embedded tokens, UUIDs, or raw encoded string
 */
export function extractTokenFromQR(value: string): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  // 1. Direct 64-hexadecimal character check
  const hex64Regex = /^[0-9a-fA-F]{64}$/;
  if (hex64Regex.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // 2. Direct Pass ID check (e.g. VYG26-00045, VYG26-00001-DUP4)
  const passIdRegex = /^VYG\d{2}-[\w-]+$/i;
  if (passIdRegex.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 3. Try parsing as a URL
  try {
    const url = new URL(trimmed);

    // Check query params: ?token=..., ?t=..., ?qr=..., ?pass=..., ?id=..., ?pass_id=...
    const candidateParams = ['token', 't', 'qr', 'pass', 'id', 'token_id', 'pass_id', 'passId', 'reg'];
    for (const param of candidateParams) {
      const paramVal = url.searchParams.get(param);
      if (paramVal) {
        const cleanParam = paramVal.trim();
        if (hex64Regex.test(cleanParam)) {
          return cleanParam.toLowerCase();
        }
        if (passIdRegex.test(cleanParam)) {
          return cleanParam.toUpperCase();
        }
        if (cleanParam.length > 3) {
          return cleanParam;
        }
      }
    }

    // Check path segments
    const pathParts = url.pathname.split('/').filter(Boolean);
    for (const part of pathParts) {
      if (hex64Regex.test(part)) {
        return part.toLowerCase();
      }
      if (passIdRegex.test(part)) {
        return part.toUpperCase();
      }
    }

    // Check hash/fragment
    if (url.hash) {
      const hashClean = url.hash.replace(/^#\/?/, '').trim();
      if (hex64Regex.test(hashClean)) {
        return hashClean.toLowerCase();
      }
      if (passIdRegex.test(hashClean)) {
        return hashClean.toUpperCase();
      }
      const hashMatch = hashClean.match(/[0-9a-fA-F]{64}/);
      if (hashMatch) {
        return hashMatch[0].toLowerCase();
      }
    }
  } catch {
    // Value is not a valid URL, continue to regex matches
  }

  // 4. Search for any contiguous 64-hex character sequence
  const anyHex64Match = trimmed.match(/[0-9a-fA-F]{64}/);
  if (anyHex64Match) {
    return anyHex64Match[0].toLowerCase();
  }

  // 5. Search for any contiguous Pass ID pattern
  const anyPassIdMatch = trimmed.match(/VYG\d{2}-[\w-]+/i);
  if (anyPassIdMatch) {
    return anyPassIdMatch[0].toUpperCase();
  }

  // 6. Search for any UUID
  const uuidMatch = trimmed.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (uuidMatch) {
    return uuidMatch[0].toLowerCase();
  }

  // 7. Fallback: If reasonably sized string, use trimmed raw value
  if (trimmed.length >= 3 && trimmed.length <= 128) {
    return trimmed;
  }

  return null;
}

/**
 * Validates whether a string is a non-empty plausible token format.
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.length >= 3 && trimmed.length <= 128;
}
