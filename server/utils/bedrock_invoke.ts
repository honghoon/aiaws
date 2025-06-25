import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// ✅ 타입 전용으로 명시
import type { H3Event, EventHandlerRequest } from 'h3';

const REGION = 'us-east-1';

const client = new BedrockRuntimeClient({ region: REGION });

type ClaudeMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function sendClaudeResponseInvoke(messages: ClaudeMessage[]) {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 8000,
      temperature: 0.7,
      messages,
    }),
  });

  const response = await client.send(command);

  if (!response.body) {
    throw new Error('Claude 응답이 비어있습니다.');
  }

  const responseString = await response.body.transformToString();
  const result = JSON.parse(responseString);

  const completion = result.content[0].text;
  return { completion };
}