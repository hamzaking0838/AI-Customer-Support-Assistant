import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const CUSTOMER_SUPPORT_SYSTEM_PROMPT = `
You are a polite, professional, and helpful customer-support representative.
Adhere strictly to the following rules:
- Give concise and useful answers.
- Avoid unnecessarily long responses.
- Never claim that you have performed an action if you did not (e.g., do not say "I have refunded your order" or "I have updated your address").
- Never invent order numbers, tracking numbers, or shipment details.
- Ask for additional information when necessary (e.g., order number, email address, or specific details).
- Clearly explain when you cannot help or when a human agent needs to step in.
- Always maintain a polite and professional tone.
`;

// Supported free-tier Gemini models to try in order of preference.
// If one fails (e.g., not available in a region or for a key type),
// the service automatically falls back to the next model.
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateResponse(customerName: string, customerMessage: string): Promise<string> {
    if (!this.genAI) {
      throw new InternalServerErrorException(
        'Gemini API Key is not configured. Please set the GEMINI_API_KEY environment variable.',
      );
    }

    const prompt = `Customer Name: ${customerName}\nCustomer Message: ${customerMessage}`;
    let lastError: Error | null = null;

    // Try each model in order until one succeeds
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: CUSTOMER_SUPPORT_SYSTEM_PROMPT,
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return responseText?.trim() || 'Thank you for reaching out. A representative will contact you shortly.';
      } catch (error) {
        const msg: string = error.message || '';
        // If model is not found (404) OR this model's free-tier quota is exhausted (429),
        // try the next model — each model has its own independent daily quota.
        if (
          msg.includes('not found') ||
          msg.includes('404') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Quota exceeded')
        ) {
          lastError = error;
          continue;
        }
        // For all other errors (auth failures, network, etc.), throw immediately
        throw new InternalServerErrorException(`Failed to generate AI response: ${msg}`);
      }
    }

    // All models exhausted (either 404 not found or 429 quota exceeded)
    const isQuotaError = lastError?.message?.includes('429') ||
      lastError?.message?.includes('RESOURCE_EXHAUSTED') ||
      lastError?.message?.includes('Quota exceeded');

    if (isQuotaError) {
      throw new InternalServerErrorException(
        'All available Gemini free-tier models have exhausted their daily quota. ' +
        'Free-tier quotas reset at midnight Pacific Time (US). ' +
        'Please wait and try again later, or upgrade to a paid Gemini plan.',
      );
    }

    throw new InternalServerErrorException(
      `No supported Gemini model found. This usually means your GEMINI_API_KEY is invalid or ` +
      `is not a standard API key (keys should start with "AIzaSy"). ` +
      `Please obtain a valid API key from https://aistudio.google.com/app/apikey. ` +
      `Last error: ${lastError?.message}`,
    );
  }
}
