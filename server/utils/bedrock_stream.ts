// server/utils/bedrock.ts
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

// ✅ 타입 전용으로 명시
import type { H3Event, EventHandlerRequest } from 'h3';
import { Readable } from 'stream';

const REGION = 'us-east-1';

const client = new BedrockRuntimeClient({ region: REGION });

type ClaudeMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function streamClaudeResponse(messages: ClaudeMessage[], event : H3Event<EventHandlerRequest>) {
  const command = new InvokeModelWithResponseStreamCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 8000,
      temperature: 0.7,
      messages
    }),
  });

  const response = await client.send(command);

  if (!response.body) {
    throw new Error('Claude 응답 스트림이 비어있습니다.');
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const writer = event.node.res;

  for await (const chunk of response.body) {
  try {
    // chunk는 이미 JS 객체
    const base64 = chunk?.chunk?.bytes;
    if (!base64) continue;

    const buffer = Buffer.from(base64, 'base64');
    const data = JSON.parse(buffer.toString('utf-8')); // 실제 Claude 메시지

    const completion = data.completion ?? data.delta?.text ?? '';
    if (completion) {
      writer.write(`data: ${completion}\n\n`);
    }
  } catch (err) {
    console.error('스트림 처리 중 오류:', err);
    continue;
  }
}

  writer.write(`event: end\ndata: [DONE]\n\n`);
  writer.end();

}