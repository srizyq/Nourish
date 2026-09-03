// Serverless proxy for photo food recognition. The Anthropic API key must
// never reach the browser — this is exactly why the old menu/plate-photo
// scanning feature was removed earlier (it called api.anthropic.com
// directly from client code with no auth, which would have meant shipping
// a secret key to every browser). This function holds the key server-side
// and the client only ever talks to our own origin.

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const PROMPT = `You're looking at a photo of food. Identify what's in it and estimate its nutrition.

Reply with ONLY a JSON object (no other text, no markdown code fence) in exactly this shape:
{"name": "short food name", "portion": "estimated portion, e.g. '1 medium bowl (~350g)'", "cal": number, "protein": number, "carbs": number, "fat": number, "confidence": "low" | "medium" | "high"}

If the photo doesn't clearly show food, reply with exactly: {"error": "No food detected in this photo."}

Macros are grams, calories are kcal, all rounded to whole numbers except macros can have one decimal. This is a best-effort visual estimate, not a lab measurement — use your best judgement on typical portion sizes and preparation (e.g. oil/butter used in cooking, dressing on a salad).`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { image, mediaType } = req.body || {};
  if (!image) {
    res.status(400).json({ error: 'Missing image' });
    return;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) {
    res.status(400).json({ error: 'Unsupported image type' });
    return;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      res.status(502).json({ error: "Couldn't read a response for this photo." });
      return;
    }

    let parsed;
    try {
      // Claude was asked for bare JSON, but strip a code fence defensively
      // in case one slips through anyway.
      const cleaned = textBlock.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse food recognition response:', textBlock.text);
      res.status(502).json({ error: "Couldn't understand the response for this photo. Try again." });
      return;
    }

    if (parsed.error) {
      res.status(200).json({ error: parsed.error });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error('Food recognition error:', err);
    res.status(502).json({ error: 'Food recognition is temporarily unavailable.' });
  }
}
