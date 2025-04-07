import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze an image using OpenAI's vision capabilities
 * @param imageBase64 Base64 encoded image
 * @param prompt Prompt describing what to analyze in the image
 * @returns The analysis of the image
 */
export async function analyzeImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'No analysis generated';
  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    throw error;
  }
} 