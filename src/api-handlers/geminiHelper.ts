/**
 * Helper to retrieve all available Gemini API Keys in pairs.
 * Priority: Cloudflare / Node process Env -> Request Headers (custom keys from user app settings)
 */
export function getGeminiApiKeys(
  arg1?: Record<string, any> | Request,
  arg2?: Record<string, any> | Request
): {
  pair1: { primary: string | null; backup: string | null };
  pair2: { primary: string | null; backup: string | null };
} {
  let env: Record<string, any> | undefined;
  let req: Request | undefined;

  if (arg1 && typeof (arg1 as Request).headers?.get === 'function') {
    req = arg1 as Request;
    env = arg2 as Record<string, any> | undefined;
  } else {
    env = arg1 as Record<string, any> | undefined;
    if (arg2 && typeof (arg2 as Request).headers?.get === 'function') {
      req = arg2 as Request;
    }
  }

  const getEnv = (key: string) => {
    const val = env?.[key] || (typeof process !== 'undefined' ? process.env?.[key] : '');
    return typeof val === 'string' ? val.trim() : '';
  };

  const getHeader = (headerName: string) => {
    if (!req || !req.headers) return '';
    try {
      const val = req.headers.get(headerName) || '';
      return val.trim();
    } catch {
      return '';
    }
  };

  const p1Primary = getEnv('GEMINI_KEY_1_PRIMARY') || getEnv('GEMINI_API_KEY') || getHeader('x-gemini-p1-primary');
  const p1Backup = getEnv('GEMINI_KEY_1_BACKUP') || getEnv('GEMINI_API_KEY_SECONDARY') || getEnv('GEMINI_API_KEY_BACKUP') || getHeader('x-gemini-p1-backup');
  const p2Primary = getEnv('GEMINI_KEY_2_PRIMARY') || getHeader('x-gemini-p2-primary');
  const p2Backup = getEnv('GEMINI_KEY_2_BACKUP') || getHeader('x-gemini-p2-backup');

  return {
    pair1: {
      primary: p1Primary || null,
      backup: p1Backup || null,
    },
    pair2: {
      primary: p2Primary || null,
      backup: p2Backup || null,
    },
  };
}

