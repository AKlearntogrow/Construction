export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'No transcript provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a construction T&M (Time & Materials) ticket parser. Extract structured data from this field worker's voice transcript.

TRANSCRIPT:
"${transcript}"

Return ONLY a raw JSON object with this structure. Do NOT wrap it in markdown code blocks. No backticks. Just the raw JSON:
{
  "date": "YYYY-MM-DD or today or yesterday",
  "labor": {
    "workers": number,
    "hours_total": number,
    "rate_type": "regular or overtime"
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

If any field cannot be determined from the transcript, use null. Return ONLY the raw JSON object, nothing else.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      return res.status(500).json({ error: `API error: ${response.status}` });
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    // Clean up markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const extracted = JSON.parse(responseText);

    return res.status(200).json(extracted);
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Failed to process transcript' });
  }
}