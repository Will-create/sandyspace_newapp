import { AIProductResult } from '@/types/Product';

interface AIServiceConfig {
  apiKey: string;
  provider: 'openai' | 'deepinfra';
  model?: string;
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async analyzeProductFromImage(
    imageUri: string,
    caption: string,
    availableCategories: string[] = [],
    availableSizes: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    availableColors: string[] = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'pink', 'purple', 'orange', 'brown', 'beige', 'gray']
  ): Promise<AIProductResult> {
    const prompt = this.buildPrompt(caption, availableCategories, availableSizes, availableColors);
    
    try {
      if (this.config.provider === 'openai') {
        return await this.callOpenAI(imageUri, prompt);
      } else {
        return await this.callDeepInfra(imageUri, prompt);
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      throw new Error('Failed to analyze product with AI. Please try again or enter details manually.');
    }
  }

  private buildPrompt(
    caption: string,
    categories: string[],
    sizes: string[],
    colors: string[]
  ): string {
    return `
You are an AI assistant helping a shop owner create product listings from images and captions.

USER CAPTION: "${caption}"

AVAILABLE OPTIONS:
Categories: ${categories.join(', ') || 'dresses, shirts, pants, shoes, accessories, bags, jewelry, electronics, home, beauty'}
Sizes: ${sizes.join(', ')}
Colors: ${colors.join(', ')}

TASK: Analyze the image and caption to extract product information.

RULES:
1. Extract or infer a clear product name
2. Extract price (look for numbers followed by 'f', 'F', 'CFA', or currency symbols)
3. Identify colors present (only use colors from the available list)
4. Identify sizes mentioned (only use sizes from the available list)
5. Generate a helpful description
6. Choose the most appropriate category

RESPONSE FORMAT (JSON only):
{
  "name": "Clear product name",
  "price": "number only (no currency)",
  "colors": ["color1", "color2"],
  "sizes": ["size1", "size2"],
  "description": "Helpful product description",
  "category": "most appropriate category"
}

If you cannot determine something from the image/caption, make reasonable assumptions based on what you can see.
`;
  }

  private async callOpenAI(imageUri: string, prompt: string): Promise<AIProductResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageUri }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return this.parseAIResponse(content);
  }

  private async callDeepInfra(imageUri: string, prompt: string): Promise<AIProductResult> {
    const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'llava-hf/llava-1.5-7b-hf',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageUri }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepInfra API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from DeepInfra');
    }

    return this.parseAIResponse(content);
  }

  private parseAIResponse(content: string): AIProductResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.name || !parsed.price) {
        throw new Error('AI response missing required fields');
      }

      return {
        name: parsed.name,
        price: parsed.price.toString(),
        colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
        description: parsed.description || '',
        category: parsed.category || 'Other',
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  // Validate caption has required elements
  static validateCaption(caption: string): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    // Check for price (numbers followed by f, F, CFA, or currency symbols)
    const pricePattern = /\d+\s*[fF]|\d+\s*CFA|\$\d+|€\d+|£\d+/;
    if (!pricePattern.test(caption)) {
      missing.push('price');
    }
    
    // Check for common colors
    const colorPattern = /(red|blue|green|yellow|black|white|pink|purple|orange|brown|beige|gray|rouge|bleu|vert|jaune|noir|blanc|rose|violet|orange|marron|beige|gris)/i;
    if (!colorPattern.test(caption)) {
      missing.push('color');
    }
    
    // Check for sizes
    const sizePattern = /(XS|S|M|L|XL|XXL|\d+|\bsmall\b|\bmedium\b|\blarge\b)/i;
    if (!sizePattern.test(caption)) {
      missing.push('size');
    }
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }
}