import Groq from 'groq-sdk';

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function invokeGroq(
  prompt: string,
  modelId: string,
): Promise<string> {
  const chatCompletion = await groqClient.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: modelId,
    temperature: 0.1,
  });

  return chatCompletion.choices[0]?.message?.content || '';
}
