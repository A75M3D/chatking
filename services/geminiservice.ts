import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

// IMPORTANT: This service requires a valid Gemini API Key in the environment.
// The key should be provided as process.env.API_KEY.
const getApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    return undefined;
  }
}

const suggestReply = async (messages: Message[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "API key not configured. Cannot suggest reply.";
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a helpful assistant suggesting a short, casual reply in a chat conversation.
    Here is the recent conversation history:
    ${messages.map(m => `${m.sender_username}: ${m.content}`).join('\n')}
    
    Suggest a suitable reply from the perspective of the last person who received a message.
    Keep the suggestion concise and natural-sounding.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error fetching Gemini suggestion:', error);
    return 'Could not generate a suggestion.';
  }
};

export const geminiService = {
  suggestReply,
};
