/**
 * Shared API Client wrapper that attaches custom Gemini API keys from localStorage
 * to headers if configured by user in App Settings.
 */

export function getCustomGeminiHeaders(): Record<string, string> {
  try {
    const saved = localStorage.getItem('noesis_gemini_custom_keys');
    if (saved) {
      const keys = JSON.parse(saved);
      const headers: Record<string, string> = {};
      if (keys.pair1Primary?.trim()) headers['x-gemini-p1-primary'] = keys.pair1Primary.trim();
      if (keys.pair1Backup?.trim()) headers['x-gemini-p1-backup'] = keys.pair1Backup.trim();
      if (keys.pair2Primary?.trim()) headers['x-gemini-p2-primary'] = keys.pair2Primary.trim();
      if (keys.pair2Backup?.trim()) headers['x-gemini-p2-backup'] = keys.pair2Backup.trim();
      return headers;
    }
  } catch (e) {
    console.error('Error reading custom Gemini keys:', e);
  }
  return {};
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const customHeaders = getCustomGeminiHeaders();
  const options = init || {};
  
  let mergedHeaders: HeadersInit = {
    ...customHeaders,
  };

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((val, key) => {
        (mergedHeaders as Record<string, string>)[key] = val;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, val]) => {
        (mergedHeaders as Record<string, string>)[key] = val;
      });
    } else {
      mergedHeaders = {
        ...mergedHeaders,
        ...options.headers,
      };
    }
  }

  options.headers = mergedHeaders;
  return fetch(input, options);
}
