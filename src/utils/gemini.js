/**
 * Parses a timetable image using the Gemini Vision API.
 * Returns a structured JSON object with days as keys and arrays of subjects as values.
 */
export async function parseTimetableImage(imageFile, apiKey) {
  const base64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/png'

  const prompt = `You are a timetable parser. Analyze this college timetable image and extract the schedule.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "timetable": {
    "Monday": [
      { "subject": "Mathematics", "time": "9:00 AM", "room": "101" },
      ...
    ],
    "Tuesday": [...],
    ...
  }
}

Rules:
- "days" should list only the days that have at least one class
- Include only actual subjects/lectures, not breaks or lunch
- If room is not visible, use empty string ""
- If time is not visible, use empty string ""
- Subject names should be short and clear (e.g., "Mathematics", "Physics", "DSA")
- Ensure the JSON is complete and valid

Analyze the image carefully and return the JSON now:`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  // Strip possible markdown code fences
  const cleaned = text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  // Validate structure
  if (!parsed.timetable || !parsed.days) {
    throw new Error('Invalid timetable structure returned')
  }

  return parsed
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // Strip the data URL prefix (e.g. "data:image/png;base64,")
      const result = reader.result.split(',')[1]
      resolve(result)
    }
    reader.onerror = reject
  })
}
