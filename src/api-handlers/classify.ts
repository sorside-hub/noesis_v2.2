import { getGeminiApiKeys } from './geminiHelper';

export async function handleClassify(req: Request, env?: Record<string, any>): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      message?: string;
      customGroqApiKey?: string;
      customGeminiApiKey?: string;
      model?: string;
    };

    const { message, customGroqApiKey, customGeminiApiKey, model } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKeys = getGeminiApiKeys(env, req);

    // Prepare Pair 2 structure:
    const pair2 = { primary: apiKeys.pair2.primary, backup: apiKeys.pair2.backup };

    const systemPrompt = `Kamu adalah AI Classifier untuk Noesis Second Brain dalam "Smart Mode" (Thinking with Vault).

Filosofi Smart Mode:
Smart Mode bukan sekadar pelacak pencarian, melainkan mode "Thinking with Vault". Vault digunakan sebagai basis konteks utama untuk berpikir, menganalisis, mengritik, merangkum, dan berkreasi.

Tugas kamu:
Menganalisis pesan pengguna dan mengklasifikasikan intent, reasoningStyle, memoryDepth, serta kategori Vault yang paling relevan.

1. Kategori Intent:
- memory_recall: Pengguna ingin mengingat atau mencari informasi dari catatan Vault.
- reflection: Pengguna membahas pengalaman, pemikiran, jurnal, atau evaluasi pribadi.
- analysis_critique: Pengguna meminta analisis, kritik, perbandingan, evaluasi, atau pengembangan ide/konsep.
- creation: Pengguna ingin membuat karya, ide, atau rencana proyek baru.
- topic_query: Pertanyaan umum atau topik sains/teknologi yang perlu diperiksa apakah pengguna memiliki catatan relevan di Vault.
- smalltalk: Basa-basi/sapaan singkat (contoh: "halo", "apa kabar", "terima kasih", "siapa kamu").

2. Reasoning Style:
- "Recall": Mengingat/mengekstrak fakta atau informasi spesifik dari Vault.
- "Explain": Menjelaskan konsep dan memperkayanya dengan pengetahuan umum.
- "Analyze": Menganalisis korelasi, hubungan logis, dan makna antar catatan.
- "Critique": Mengevaluasi ide, mencari risiko/kelemahan, dan memberikan saran konkret.
- "Compare": Membandingkan dua atau lebih catatan, konsep, atau evolusi pemikiran.
- "Synthesize": Merangkum dan menyintesis pola baru dari beberapa catatan.
- "Brainstorm": Mengembangkan ide baru menggunakan Vault sebagai inspirasi.

3. Memory Depth:
- "shallow": Pencarian terfokus ringan (topK 3). Cocok untuk Recall.
- "normal": Pencarian standar (topK 5). Cocok untuk Explain.
- "deep": Pencarian mendalam (topK 8). Cocok untuk Analyze, Critique, Compare.
- "very_deep": Pencarian sangat mendalam (topK 10, multi-kategori). Cocok untuk Synthesize.
- "broad": Pencarian eksploratif luas (topK 8, ambang batas rendah). Cocok untuk Brainstorm.

4. Aturan needRAG:
- Set needRAG = false HANYA jika intent adalah "smalltalk" (sapaan/basa-basi murni).
- Set needRAG = true untuk SEMUA intent lain.

5. Kategori Vault:
- "world": informasi eksternal, pengetahuan umum, sains, buku.
- "self": jurnal pribadi, refleksi, evaluasi emosi.
- "ideas": gagasan, konsep proyek, ide pengembangan.
- null jika relevan untuk semua/multi-kategori.

Output WAJIB berupa JSON valid saja tanpa teks tambahan:
{
  "needRAG": boolean,
  "intent": "memory_recall" | "reflection" | "analysis_critique" | "creation" | "topic_query" | "smalltalk",
  "reasoningStyle": "Recall" | "Explain" | "Analyze" | "Critique" | "Compare" | "Synthesize" | "Brainstorm",
  "memoryDepth": "shallow" | "normal" | "deep" | "very_deep" | "broad",
  "category": "world" | "self" | "ideas" | null,
  "confidence": number (0-1),
  "reason": "Penjelasan singkat alasan klasifikasi"
}`;

    let rawJsonResponse = '';

    // Attempts logic for Pair 2:
    // 1. Pair 2 Primary (gemini-3.5-flash-lite)
    // 2. Pair 2 Backup (gemini-3.5-flash-lite)
    // 3. Pair 2 Backup (gemini-3.5-flash)
    const attempts = [
      { key: pair2.primary, model: 'gemini-3.5-flash-lite', label: 'Pair 2 Primary' },
      { key: pair2.backup, model: 'gemini-3.5-flash-lite', label: 'Pair 2 Backup (lite)' },
      { key: pair2.backup, model: 'gemini-3.5-flash', label: 'Pair 2 Backup (flash)' },
    ];

    for (const attempt of attempts) {
      if (!attempt.key) continue;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${attempt.key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${message}` }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const textCandidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textCandidate) {
            rawJsonResponse = textCandidate;
            break;
          }
        }
      } catch (e) {
        console.warn(`[Classify AI] ${attempt.label} [Model ${attempt.model}] failed:`, e);
      }
    }

    if (!rawJsonResponse) {
      return new Response(
        JSON.stringify({ error: 'Gagal memproses klasifikasi dari AI (Pair 2 gagal).' }),
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
            JSON.stringify({ error: 'Gagal memproses format JSON dari AI.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Gagal memproses format JSON dari AI.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    let category = jsonResult.category || null;
    if (typeof category === 'string') {
      category = category.trim().toLowerCase();
      if (['', 'null', 'all', 'none'].includes(category)) {
        category = null;
      }
    } else {
      category = null;
    }

    return new Response(
      JSON.stringify({
        needRAG: Boolean(jsonResult.needRAG),
        intent: jsonResult.intent || 'general',
        reasoningStyle: jsonResult.reasoningStyle || undefined,
        memoryDepth: jsonResult.memoryDepth || undefined,
        category,
        confidence: typeof jsonResult.confidence === 'number' ? jsonResult.confidence : 0.8,
        reason: jsonResult.reason || '',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error pada Classify' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
