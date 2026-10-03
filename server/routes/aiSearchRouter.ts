import { Router, type Request, type Response } from 'express';

export const aiSearchRouter = Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function cleanJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : text.trim();
}

aiSearchRouter.get('/web', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const term = String(req.query.term || '').trim().slice(0, 120);
  const cities = String(req.query.cities || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 50);

  if (!apiKey) {
    res.status(503).json({ error: 'GEMINI_API_KEY não configurada no Render.' });
    return;
  }
  if (!term) {
    res.status(400).json({ error: 'Informe o cargo/profissão.' });
    return;
  }

  const cityText = cities.length ? cities.join(', ') : 'cidade não informada';
  const prompt = `Pesquise na internet por vagas de emprego PUBLICADAS recentemente para o cargo/profissão: "${term}".
Priorize vagas reais e abertas, com foco nestas cidades: ${cityText}.
Pesquise em múltiplos sites e portais de emprego, páginas de empresas, LinkedIn público, Indeed, Gupy, InfoJobs, Catho, sites locais e páginas de recrutamento.
Não invente vagas, URLs, empresas ou e-mails. Só retorne dados encontrados nas páginas pesquisadas.
Para cada resultado, tente identificar: cargo, empresa, cidade/UF, data de publicação (se disponível), URL da vaga, e-mail de candidatura/recrutamento (se estiver publicamente disponível) e um resumo.
Retorne SOMENTE JSON válido no formato:
{"results":[{"title":"","company":"","city":"","state":"","publishedDate":"","url":"","emails":[],"email":"","snippet":"","source":""}]}
Pesquise também contatos públicos de RH/recrutamento/trabalhe conosco da mesma empresa. Não invente e-mails. Se houver vários e-mails públicos da mesma empresa, mantenha todos. Uma empresa pode ser incluída mesmo que a vaga não tenha e-mail, desde que exista evidência pública da oportunidade. Restrinja estritamente à cidade/UF solicitada. Retorne no máximo 100 resultados.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || 'Falha na pesquisa web por IA.' });
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
    const parsed = JSON.parse(cleanJson(text));
    res.json({
      results: Array.isArray(parsed.results) ? parsed.results : [],
      searchedTerm: term,
      cities,
      model: GEMINI_MODEL,
    });
  } catch (error: any) {
    res.status(502).json({ error: error.message || 'Falha ao pesquisar na internet com IA.' });
  }
});
