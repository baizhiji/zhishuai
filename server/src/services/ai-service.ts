/**
 * AI Service - Works without database
 */
import axios from 'axios';

const BAIDU_API_URL = process.env.BAIDU_API_URL || 'https://aip.baidubce.com';
const BAIDU_API_KEY = process.env.BAIDU_API_KEY || '';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionParams {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Get Baidu access token
 */
async function getAccessToken(): Promise<string> {
  if (BAIDU_API_KEY && BAIDU_SECRET_KEY) {
    try {
      const response = await axios.post(
        `${BAIDU_API_URL}/oauth/2.0/token`,
        null,
        {
          params: {
            grant_type: 'client_credentials',
            client_id: BAIDU_API_KEY,
            client_secret: BAIDU_SECRET_KEY
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to get Baidu access token:', error);
    }
  }
  return '';
}

/**
 * Chat completion - works with Baidu ERNIE or fallback
 */
export async function chatCompletion(
  userId: string,
  params: ChatCompletionParams
): Promise<string> {
  const { messages } = params;
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // Try Baidu ERNIE first
  const accessToken = await getAccessToken();
  
  if (accessToken) {
    try {
      const response = await axios.post(
        `${BAIDU_API_URL}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions`,
        {
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        },
        {
          params: { access_token: accessToken }
        }
      );
      return response.data.result;
    } catch (error) {
      console.error('Baidu API error:', error);
    }
  }
  
  // Fallback: Generate mock response based on topic
  return generateFallbackResponse(lastMessage);
}

/**
 * Generate fallback response
 */
function generateFallbackResponse(prompt: string): string {
  const topic = prompt.toLowerCase();
  
  if (topic.includes('title')) {
    return `1. AI helps work efficiency skyrocket
2. Secrets of AI productivity tools
3. 5 AI tools you must know in 2024
4. How AI changes our lives
5. AI tips that will blow your mind`;
  }
  
  if (topic.includes('hashtag') || topic.includes('tag')) {
    return `#AI #Tech #Innovation #Future #Productivity #Tools #Tips #Life #Learning #Growth`;
  }
  
  if (topic.includes('script')) {
    return `Opening (3s): "Have you ever wondered..."
Main content: Share insights and tips
Call to action: "Like and follow for more"
Duration: 60 seconds`;
  }
  
  if (topic.includes('recruit') || topic.includes('job')) {
    return `Position: AI Product Manager
Requirements:
- 3+ years experience
- Strong communication skills
- Technical background preferred

Salary: 25K-40K/month
Location: Beijing`;
  }
  
  return `Here is the generated content based on your request. In a production environment with proper API credentials, this would return AI-generated content tailored to your specific needs.`;
}

/**
 * Generate image
 */
export async function generateImage(
  userId: string,
  params: { prompt: string; size?: string }
): Promise<{ url: string }> {
  // Return placeholder URL
  return {
    url: `https://via.placeholder.com/512x512.png?text=AI+Generated`
  };
}

/**
 * Text to speech
 */
export async function textToSpeech(
  userId: string,
  params: { text: string; voice?: string }
): Promise<{ url: string }> {
  // Return placeholder URL
  return {
    url: `https://example.com/audio/placeholder.mp3`
  };
}

export default { chatCompletion, generateImage, textToSpeech };
