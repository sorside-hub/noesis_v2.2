import { getGeminiApiKeys } from './geminiHelper';

export async function handleAiStatus(req: Request, env?: Record<string, any>): Promise<Response> {
  const geminiKeys = getGeminiApiKeys(env, req);

  const check = (key: string | null) => Boolean(key && key.trim().length > 0);

  return new Response(
    JSON.stringify({
      gemini: {
        pair1: {
          primary: check(geminiKeys.pair1.primary),
          backup: check(geminiKeys.pair1.backup),
        },
        pair2: {
          primary: check(geminiKeys.pair2.primary),
          backup: check(geminiKeys.pair2.backup),
        },
        model: 'gemini-3.6-flash',
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

