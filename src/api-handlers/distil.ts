import { getGeminiApiKeys } from './geminiHelper';

export async function handleDistil(req: Request, env?: Record<string, any>): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      content?: string;
    };

    const { title, content } = body;

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Isi catatan tidak boleh kosong untuk didistil.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKeys = getGeminiApiKeys(env, req);
    const pair2 = { primary: apiKeys.pair2.primary, backup: apiKeys.pair2.backup };

    const systemPrompt = `Kamu adalah Noesis Distiller, engine penyaring wawasan cerdas.
Tugasmu adalah mendistilasi (menyaring & mengekstrak) catatan berikut menjadi ringkasan yang bernilai tinggi.
Sajikan dalam format Markdown yang rapi dengan struktur berikut:

### 💡 Intisari Eksekutif
(1-2 kalimat ringkasan tingkat tinggi)

### 🔑 Poin-Poin Utama
- (Gagasan/fakta kunci 1)
- (Gagasan/fakta kunci 2)

### 🎯 Aksi & Tindak Lanjut
- [ ] (Aksi konkret atau langkah selanjutnya jika ada)

Gunakan Bahasa Indonesia yang tajam, elegan, dan langsung pada intinya.`;

    const userPrompt = `Judul Catatan: ${title || 'Tanpa Judul'}\n\nIsi Catatan:\n${content}`;

    let stream: ReadableStream | null = null;

    const attempts = [
      { key: pair2.primary, model: 'gemini-3.6-flash', label: 'Pair 2 Primary (3.6)' },
      { key: pair2.backup, model: 'gemini-3.6-flash', label: 'Pair 2 Backup (3.6)' },
      { key: pair2.backup, model: 'gemini-3.5-flash', label: 'Pair 2 Backup (3.5)' },
    ];

    for (const attempt of attempts) {
      if (!attempt.key) continue;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:streamGenerateContent?key=${attempt.key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.5 },
          }),
        });

        if (res.ok && res.body) {
          stream = res.body;
          break;
        }
      } catch (e) {
        console.warn(`[Distil AI] ${attempt.label} [Model ${attempt.model}] failed:`, e);
      }
    }

    if (!stream) {
      return new Response(JSON.stringify({ error: 'Gagal memproses distilasi dari semua AI (Pair 2 gagal).' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Proxy the stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal Server Error pada Distil API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
