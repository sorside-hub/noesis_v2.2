import { getGeminiApiKeys } from './geminiHelper';

export async function handleChat(req: Request, env?: Record<string, any>): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as { message?: string; history?: any[] };
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKeys = getGeminiApiKeys(env, req);

    // Prepare API structure for Pair 1
    const pair1 = { primary: apiKeys.pair1.primary, backup: apiKeys.pair1.backup };

    const systemInstruction = `Kamu adalah Noesis, sebuah personal AI assistant dan second brain pengguna yang cerdas, minimalis, dan sangat membantu. 
Kamu terintegrasi secara langsung dengan Vault (catatan dan memori pribadi) pengguna.
DILARANG KERAS menyatakan bahwa kamu tidak memiliki akses, tidak memiliki izin, atau tidak terhubung ke Vault pengguna.
Ikuti instruksi konteks mode RAG yang diberikan pada setiap pesan dengan disiplin tinggi.
Tugasmu adalah memberikan jawaban yang ringkas, berwawasan, akurat, dan ramah dalam bahasa Indonesia (atau mengikuti bahasa pengguna jika mereka bertanya dalam bahasa lain).
Berikan jawaban dengan format Markdown yang rapi dan mudah dibaca di layar HP/mobile.`;

    let contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      contents = history.map((item) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.content || '' }],
      }));
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const geminiPayload = (model: string) => ({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
      },
    });

    // Fallback logic for Pair 1 only:
    // 1. Try Pair 1 Primary (gemini-3.6-flash)
    // 2. Try Pair 1 Backup (gemini-3.6-flash)
    // 3. Try Pair 1 Backup (gemini-3.5-flash)
    const attempts = [
      { key: pair1.primary, model: 'gemini-3.6-flash', label: 'Pair 1 Primary' },
      { key: pair1.backup, model: 'gemini-3.6-flash', label: 'Pair 1 Backup (3.6)' },
      { key: pair1.backup, model: 'gemini-3.5-flash', label: 'Pair 1 Backup (3.5)' },
    ];

    let geminiRes: Response | null = null;
    let usedModel = 'gemini-3.6-flash';
    let lastErr = '';

    for (const attempt of attempts) {
      if (!attempt.key) continue;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:streamGenerateContent?alt=sse&key=${attempt.key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload(attempt.model)),
        });

        if (res.ok && res.body) {
          geminiRes = res;
          usedModel = attempt.model;
          break;
        } else {
          const errText = await res.text();
          lastErr = `${attempt.label} [Model ${attempt.model}] gagal (${res.status}): ${errText}`;
          console.warn(`[Chat API] ${lastErr}`);
        }
      } catch (e: any) {
        lastErr = `${attempt.label} [Model ${attempt.model}] ${e?.message || String(e)}`;
        console.warn(`[Chat API] ${lastErr}`);
      }
    }

    if (!geminiRes || !geminiRes.body) {
      return new Response(
        JSON.stringify({
          error: lastErr || 'Gagal terhubung dengan layanan Gemini AI.',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const isFallback = usedModel !== 'gemini-3.6-flash';
      const metaChunk = `data: ${JSON.stringify({ modelMeta: { model: usedModel, isFallback, primaryModel: 'gemini-3.6-flash' } })}\n\n`;
      await writer.write(encoder.encode(metaChunk));

      const reader = geminiRes!.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const jsonStr = trimmed.substring(5).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const textChunk =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (textChunk) {
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ text: textChunk })}\n\n`)
                );
              }
            } catch (e) {
              // Ignore parse chunk errors
            }
          }
        }
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err: any) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: err?.message || 'Stream error' })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal Server Error pada Chat API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
