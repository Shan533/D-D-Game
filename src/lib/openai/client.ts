/**
 * OpenAI client wrapper that uses the API route
 * This keeps the API key secure by only using it on the server
 */

interface AICompletionOptions {
  prompt: string;
  model?: string;
  max_tokens?: number;
}

interface AICompletionResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

/**
 * Generate text using OpenAI API via our secure server-side API route
 */
export async function generateAIResponse({
  prompt,
  model = 'gpt-3.5-turbo',
  max_tokens = 1000,
}: AICompletionOptions): Promise<AICompletionResponse> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        max_tokens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error generating AI response');
    }

    return data;
  } catch (error: any) {
    console.error('AI client error:', error);
    return {
      text: '',
      error: error.message || 'Failed to generate AI response',
    };
  }
}

export default {
  generateResponse: generateAIResponse
}; 