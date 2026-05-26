import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import * as dotenv from 'dotenv';

// Load environment variables from relative parent .env
dotenv.config({ path: '../.env' });

async function main() {
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const payload = {
    messages: [
      { role: 'user', content: [{ text: 'Explain Redis in simple terms.' }] },
    ],
    inferenceConfig: { max_new_tokens: 1024 },
  };

  const command = new InvokeModelCommand({
    modelId: 'us.amazon.nova-micro-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  interface BedrockResponse {
    output: {
      message: {
        content: Array<{ text: string }>;
      };
    };
  }

  const response = await client.send(command);
  const result = JSON.parse(
    new TextDecoder().decode(response.body),
  ) as BedrockResponse;
  console.log(result.output.message.content[0].text);
}

main().catch(console.error);
