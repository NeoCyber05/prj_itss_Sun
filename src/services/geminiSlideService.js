const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `
You are an instructional slide drafting assistant for RakuSlide.
Your job is to turn a user's topic and keywords into a lesson outline and detailed draft text for slides.
Write in the same language as the user's request.
Return only valid JSON. Do not wrap the JSON in markdown.
The JSON schema must be:
{
  "deckTitle": "short presentation title",
  "slides": [
    {
      "title": "slide title",
      "bullets": ["3 to 5 concise bullet points"],
      "speakerNotes": "short detailed explanation for this slide"
    }
  ]
}
Create 4 to 7 slides unless the user requests a different number.
Keep each bullet useful for direct insertion into a slide.
`;

function getGeminiConfig() {
  return {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY?.trim(),
    model: import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  };
}

function stripJsonFence(value) {
  return String(value ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseGeminiJson(text) {
  const cleanedText = stripJsonFence(text);

  try {
    return JSON.parse(cleanedText);
  } catch {
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1));
    }

    throw new Error('Gemini did not return valid JSON.');
  }
}

function normalizeGeneratedDeck(payload, fallbackTitle) {
  const slides = Array.isArray(payload?.slides) ? payload.slides : [];
  const normalizedSlides = slides
    .map((slide, index) => {
      const bullets = Array.isArray(slide?.bullets)
        ? slide.bullets.map((item) => String(item).trim()).filter(Boolean)
        : [];

      return {
        bullets,
        speakerNotes: String(slide?.speakerNotes ?? '').trim(),
        title: String(slide?.title ?? `Slide ${index + 1}`).trim() || `Slide ${index + 1}`,
      };
    })
    .filter((slide) => slide.title || slide.bullets.length || slide.speakerNotes);

  return {
    deckTitle: String(payload?.deckTitle ?? fallbackTitle ?? '').trim() || fallbackTitle,
    slides: normalizedSlides,
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

export async function generateSlideDraftWithGemini({ prompt, deckTitle }) {
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
                'Generate a lesson slide draft for this deck.',
              ].join('\n'),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
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

  return normalizeGeneratedDeck(parseGeminiJson(text), deckTitle);
}
