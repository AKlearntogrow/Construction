import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'No transcript provided' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a construction T&M (Time & Materials) ticket parser. Extract structured data from this field worker's voice transcript.

TRANSCRIPT:
"${transcript}"

Extract and return ONLY a JSON object with this structure (no other text):
{
  "date": "YYYY-MM-DD or 'today' or 'yesterday'",
  "labor": {
    "workers": number,
    "hours_total": number,
    "rate_type": "regular" or "overtime"
  },
  "materials": [
    {
      "item": "description",
      "quantity": number,
      "unit": "ft/ea/lbs/etc"
    }
  ],
  "location": "where the work was done",
  "description": "brief summary of work performed",
  "cost_code_suggestion": "CSI code if identifiable, otherwise null"
}

If any field cannot be determined from the transcript, use null.
Return ONLY the JSON, no explanation.`
        }
      ],
    });

    // Extract the text content from Claude's response
    const responseText = message.content[0].text;
    
    // Parse the JSON from Claude's response
    const extracted = JSON.parse(responseText);

    return res.status(200).json(extracted);
  } catch (error) {
    console.error('Claude API error:', error);
    return res.status(500).json({ error: 'Failed to process transcript' });
  }
}