import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';

export async function getGeminiResponse(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    // Extract the response text from Gemini API response
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error: any) {
    if (error.response && error.response.status === 429) {
      // Mock response for quota exceeded
      return '[Gemini quota exceeded: This is a mock AI response for demo purposes.]';
    }
    console.error('Gemini API error:', error.response?.data || error.message);
    throw new Error('Failed to get response from Gemini API');
  }
} 