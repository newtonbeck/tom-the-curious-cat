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
 * @returns Either the next action to take or the solution in JSON format
 */
export async function analyzeImage(
  imageBase64: string,
  prompt: string
): Promise<{ type: 'action' | 'solution', data: any }> {
  try {
    const systemPrompt = `
You are an AI agent that helps users navigate web pages to accomplish tasks.
Given a screenshot of a webpage and a user's prompt, you need to either:
1. Determine the next action to take to move closer to the solution, or
2. Provide the solution if it's already visible on the page.

Your response MUST be in valid JSON format with the following structure:
{
  "type": "action" | "solution",
  "data": {
    // If type is "action":
    "action": "click" | "type",
    "target": "exact visible text of the element to click, try to be as specific as possible and to use unique texts",
    "value": "value to input if action is 'type'",
    "explanation": "brief explanation of why this action is needed"
    
    // If type is "solution":
    "answer": "the solution to the user's prompt",
    "source": "where on the page the solution was found"
  }
}

Be specific with selectors when possible. If you can't find an exact selector, describe the element in detail.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
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
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    throw error;
  }
} 