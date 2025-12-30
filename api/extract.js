import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Standard construction trades for reference
const STANDARD_TRADES = [
  'Electrician',
  'Plumber', 
  'HVAC Technician',
  'Carpenter',
  'Painter',
  'Mason',
  'Roofer',
  'Welder',
  'Pipefitter',
  'Sheet Metal Worker',
  'Ironworker',
  'Laborer',
  'Foreman',
  'Superintendent',
  'Equipment Operator',
  'Concrete Finisher',
  'Drywall Installer',
  'Insulation Worker',
  'Glazier',
  'Flooring Installer',
  'Tile Setter',
  'Fire Sprinkler Fitter',
  'Millwright',
  'Boilermaker',
  'Elevator Mechanic'
];

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

IMPORTANT: Extract ALL mentioned values including hourly rates, quantities, and costs. If a rate is mentioned (like "$60 per hour" or "$85/hr"), capture it.

STANDARD CONSTRUCTION TRADES (match to closest one):
${STANDARD_TRADES.join(', ')}

TRANSCRIPT:
"${transcript}"

Extract and return ONLY a JSON object with this structure (no other text, no markdown):
{
  "description": "Brief summary of work performed",
  "location": "Where the work was done (building, room, area)",
  "date": "YYYY-MM-DD or 'today' or 'yesterday' if mentioned",
  "labor": [
    {
      "trade": "Standard trade name from list above (e.g., 'Plumber', 'Electrician')",
      "workers": 2,
      "hours": 8,
      "rate": 60.00
    }
  ],
  "materials": [
    {
      "item": "Material description",
      "quantity": 10,
      "unit": "ft/ea/lbs/box/roll/etc",
      "unit_cost": 12.50
    }
  ],
  "cost_code_suggestion": "CSI code if identifiable (e.g., '26 05 00' for electrical), otherwise null",
  "compliance": "Any safety or compliance notes mentioned"
}

PARSING RULES:
1. For labor: Calculate total hours per worker. If "4 hours each" with 2 workers, that's workers:2, hours:4 (per worker)
2. For rates: Extract hourly rate if mentioned ("$60 an hour" = rate:60). If not mentioned, use rate:0
3. For materials: Extract unit cost if mentioned ("$12 each" = unit_cost:12). If not mentioned, use unit_cost:0
4. Match trade names to the standard list above (e.g., "plumbers" → "Plumber")
5. If multiple trades mentioned, create separate entries in the labor array
6. If duration is "7 days 8 hours a day", calculate total hours: 7 * 8 = 56 hours

Return ONLY valid JSON, no explanation.`
        }
      ],
    });

    // Parse the response
    let extractedData;
    try {
      // Get the text content from Claude's response
      const responseText = message.content[0].text;
      
      // Clean up the response - remove any markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', message.content[0].text);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        raw: message.content[0].text 
      });
    }

    return res.status(200).json(extractedData);

  } catch (error) {
    console.error('Error calling Claude API:', error);
    return res.status(500).json({ error: 'Failed to process transcript' });
  }
}
