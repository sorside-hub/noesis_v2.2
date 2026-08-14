import { getGeminiApiKeys } from './geminiHelper.ts';

export async function handleAutoCorrect(req: Request, env?: Record<string, any>): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      content?: string;
    };

    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Isi catatan tidak boleh kosong untuk Auto Correct.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKeys = getGeminiApiKeys(env, req);
    const pair2 = { primary: apiKeys.pair2.primary, backup: apiKeys.pair2.backup };

    const systemPrompt = `Kamu adalah AI Auto Correct & Refiner tulisan untuk Noesis Vault.
Tugasmu adalah membenahi dan memperbaik tulisan catatan pengguna agar lebih rapi, tanpa menghilangkan gaya bahasa, nada bicara, emosi, dan karakter asli penulis.

PETUNJUK PERBAIKAN:
1. YANG WAJIB DIPERBAIKI: Typo, ejaan, tata bahasa, tanda baca, struktur kalimat.
2. YANG DILARANG: Mengubah makna asli, emosi, nuansa, gaya bahasa pribadi.

FORMAT OUTPUT:
Kembalikan JSON valid saja dengan format:
{
  "correctedText": "isi catatan yang sudah diperbaiki"
}`;

    const userPrompt = `Isi Catatan Asli:\n${content}`;

    const attempts = [
      { key: pair2.primary, model: 'gemini-3.5-flash-lite', label: 'Pair 2 Primary' },
      { key: pair2.backup, model: 'gemini-3.5-flash-lite', label: 'Pair 2 Backup (lite)' },
      { key: pair2.backup, model: 'gemini-3.5-flash', label: 'Pair 2 Backup (flash)' },
    ];

    let rawJsonResponse = '';

    for (const attempt of attempts) {
      if (!attempt.key) continue;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${attempt.key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const textCandidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textCandidate) {
            rawJsonResponse = textCandidate;
            break;
          }
        }
      } catch (e) {
        console.warn(`[AutoCorrect AI] ${attempt.label} [Model ${attempt.model}] failed:`, e);
      }
    }

    if (!rawJsonResponse) {
      return new Response(
        JSON.stringify({ error: 'Gagal memproses Auto Correct dari AI (Pair 2 gagal).' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let jsonResult: any = {};
    let cleanedText = rawJsonResponse.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    try {
      jsonResult = JSON.parse(cleanedText);
    } catch {
      const match = cleanedText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          jsonResult = JSON.parse(match[0]);
        } catch {
          return new Response(
            JSON.stringify({ error: 'Gagal memproses format JSON dari Gemini AI.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Gagal memproses format JSON dari Gemini AI.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const correctedText =
      typeof jsonResult.correctedText === 'string' ? jsonResult.correctedText : content;

    return new Response(JSON.stringify({ correctedText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error pada Auto Correct' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
