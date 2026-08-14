import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKeys } from "./geminiHelper";

export async function handleReflections(req: Request, env?: Record<string, any>): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const { themes = [], thinkingPatterns = [], connections = [], notes = [] } = body;

    const apiKeys = getGeminiApiKeys(env, req);
    const pair2 = { primary: apiKeys.pair2.primary, backup: apiKeys.pair2.backup };

    // Construct high-quality context text about themes, thinking patterns, connections, and notes
    let dataContext = `DATA GRAPH PENGETAHUAN NOESIS:\n\n`;

    dataContext += `[CATATAN DI VAULT (Jumlah: ${notes.length})]\n`;
    notes.slice(0, 15).forEach((note: any) => {
      dataContext += `- ID: "${note.id}" | Judul: "${note.title || 'Tanpa Judul'}" | Kategori: "${note.category || 'Umum'}" | Tag: ${(note.tags || []).join(', ')}\n`;
      if (note.content) {
        dataContext += `  Konten: ${note.content.slice(0, 250)}\n`;
      }
    });

    dataContext += `\n[TEMA YANG TERBENTUK (Jumlah: ${themes.length})]\n`;
    themes.slice(0, 10).forEach((t: any) => {
      dataContext += `- ID: "${t.id}" | Nama Tema: "${t.title}" | Deskripsi: "${t.description}" | ID Catatan Terkait: ${(t.relatedNoteIds || []).join(', ')}\n`;
    });

    dataContext += `\n[POLA PIKIR YANG TERDETEKSI (Jumlah: ${thinkingPatterns.length})]\n`;
    thinkingPatterns.slice(0, 10).forEach((p: any) => {
      dataContext += `- ID: "${p.id}" | Pola Pikir: "${p.title}" | Penjelasan: "${p.description}" | ID Catatan Bukti: ${(p.relatedNoteIds || []).join(', ')}\n`;
    });

    dataContext += `\n[HUBUNGAN IDE / CONNECTIONS (Jumlah: ${connections.length})]\n`;
    connections.slice(0, 10).forEach((c: any) => {
      dataContext += `- ID: "${c.id}" | Nama Hubungan: "${c.title}" | Penjelasan: "${c.description}" | ID Sumber: ${(c.sourceIds || []).join(', ')} | ID Target: ${(c.targetIds || []).join(', ')}\n`;
    });

    const systemPrompt = `Kamu adalah Noesis Reflection Synthesis Engine.
Tugasmu adalah menghasilkan refleksi berbasis bukti (evidence-based reflections) berdasarkan pola kognitif, tema, hubungan ide, dan catatan yang ada di graph pengetahuan pengguna.

ATURAN STRICT GENERASI REFLEKSI:
1. NO PERSONALITY ANALYSIS: Jangan membuat analisis kepribadian, profiling karakter, diagnosis psikologis, atau penghakiman sifat pengguna.
2. NO DIAGNOSIS: Dilarang keras memberikan saran medis, klinis, atau diagnosis psikologi.
3. NO UNSUPPORTED ASSUMPTIONS: Jangan membuat asumsi di luar data catatan nyata yang diberikan. Refleksi harus murni menjembatani benang merah dari data yang ada.
4. EVIDENSI JELAS: Setiap objek refleksi harus menautkan array ID yang valid dari sumber data ke dalam \`relatedThemeIds\`, \`relatedConnectionIds\`, dan \`relatedNoteIds\`. Jika tidak ada relasi langsung ke salah satunya, biarkan berupa array kosong.
5. KLASIFIKASI REFLEKSI (type): Kamu wajib mengklasifikasikan setiap refleksi ke dalam salah satu dari tipe berikut:
   - "creative_reflection" (jika menyoroti koneksi kreatif antara konsep berbeda)
   - "pattern_reflection" (jika menyoroti pola berpikir atau struktur kognitif yang berulang)
   - "growth_reflection" (jika menunjukkan area pembelajaran atau potensi pendalaman wawasan)
   - "tension_reflection" (jika menyoroti anomali atau pertentangan sudut pandang antar catatan)
6. DASAR PEMBENTUKAN (formationBasis): Tuliskan 1-3 kalimat penjelasan mengapa refleksi ini terbentuk dari relasi beberapa catatan tertentu (sebutkan beberapa judul catatan terkait). Jelaskan juga konsep utama yang menghubungkan semuanya secara sinergis.
7. PERBAIKAN PERTANYAAN INDUKTIF (question): Pertanyaan reflektif tidak boleh terlalu akademis/kaku (hindari contoh seperti "Bagaimana pemahaman tentang X dapat memperkaya metodologi..."). Gunakan gaya eksplorasi personal yang hangat dan mendalam, misalnya: "Apakah cara kamu menyusun musik memiliki pola yang sama dengan cara kamu menyusun ide?". Harus menggunakan kata "kamu" agar kontemplatif personal. Pertanyaan tidak boleh berupa nasihat, kesimpulan, atau diagnosis.
8. STRUKTUR REFLEKSI:
   - type: Tipe klasifikasi dari aturan #5.
   - title: Judul refleksi yang ringkas, bernuansa kontemplatif praktis (3-6 kata).
   - observation: Pernyataan objektif merangkum benang merah yang terlihat dari data.
   - formationBasis: Penjelasan dasar pembentukan dari aturan #6.
   - question: Pertanyaan pemantik eksplorasi personal dari aturan #7.
   - context: Penjelasan singkat mengapa hal ini berharga bagi eksplorasi kognitif mereka.
9. BAHASA INDONESIA: Gunakan bahasa Indonesia yang santun, kontemplatif, tajam, profesional, dan ringkas.

Hasilkan minimal 2 dan maksimal 4 refleksi yang paling berharga dari data di atas.`;

    let rawJsonResponse = '';

    const attempts = [
      { key: pair2.primary, model: 'gemini-3.1-pro-preview', label: 'Pair 2 Primary' },
      { key: pair2.backup, model: 'gemini-3.1-pro-preview', label: 'Pair 2 Backup (pro)' },
      { key: pair2.backup, model: 'gemini-3.6-flash', label: 'Pair 2 Backup (flash)' },
    ];

    for (const attempt of attempts) {
      if (!attempt.key) continue;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${attempt.key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${dataContext}` }] }],
            generationConfig: {
              temperature: 0.3,
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
        console.warn(`[Reflection AI] ${attempt.label} [Model ${attempt.model}] failed:`, e);
      }
    }

    if (!rawJsonResponse) {
      return new Response(
        JSON.stringify({ error: 'Gagal menghasilkan refleksi menggunakan AI.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanedText = rawJsonResponse
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);
    const reflections = (Array.isArray(parsed?.reflections) ? parsed.reflections : []).map((refl: any, index: number) => {
      const now = Date.now();
      return {
        id: refl.id || `refl_${now}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        type: refl.type || 'pattern_reflection',
        title: refl.title || 'Refleksi Sintetis',
        observation: refl.observation || '',
        formationBasis: refl.formationBasis || 'Refleksi ini terbentuk dari jalinan relasi ide dalam catatan Anda.',
        question: refl.question || '',
        context: refl.context || '',
        relatedThemeIds: Array.isArray(refl.relatedThemeIds) ? refl.relatedThemeIds : [],
        relatedConnectionIds: Array.isArray(refl.relatedConnectionIds) ? refl.relatedConnectionIds : [],
        relatedNoteIds: Array.isArray(refl.relatedNoteIds) ? refl.relatedNoteIds : [],
        createdAt: now + index,
      };
    });

    return new Response(JSON.stringify({ reflections }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in handleReflections:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Terjadi kesalahan internal pada Reflection Engine.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
