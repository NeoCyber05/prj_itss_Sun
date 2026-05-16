const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `
You are an instructional slide drafting assistant for RakuSlide.
Your job is to turn a user's topic and keywords into a lesson outline with layout instructions and detailed text content for each slide.
Write in the same language as the user's request.
Return ONLY the markdown content itself. Do NOT include any introductory or closing sentence such as "Here is the draft..." or "Below is the outline...". Start directly with the first slide heading.
Format the output as clean markdown: use ## for each slide title, bullet points for content, and **bold** for important terms. Keep it concise and structured.
`;

function getGeminiConfig() {
  return {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY?.trim(),
    model: import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  };
}

function getGeminiText(responsePayload) {
  return (responsePayload?.candidates ?? [])
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

export async function generateAiTextWithGemini({ prompt, deckTitle }) {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to .env and restart Vite.');
  }

  const userPrompt = String(prompt ?? '').trim();

  if (!userPrompt) {
    throw new Error('Enter a topic or keywords before generating slides.');
  }

  const response = await fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                `Current deck title: ${deckTitle || 'Untitled deck'}`,
                `User topic and keywords: ${userPrompt}`,
                'Generate a lesson slide draft for this deck, including layout instructions and detailed text content for each slide.',
              ].join('\n'),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'text/plain',
        temperature: 0.7,
      },
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT.trim() }],
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    method: 'POST',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini request failed with ${response.status}.`);
  }

  const text = getGeminiText(payload);

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}
