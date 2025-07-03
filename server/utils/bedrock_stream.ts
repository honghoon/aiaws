// server/utils/bedrock.ts
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { ServerResponse } from 'http';
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

export async function streamFallbackMessage(event: H3Event, message: string, end: boolean=true) {
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const writer = event.node.res;

  for (const char of message) {
    writer.write(`data: ${char}\n\n`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  writer.write(`event: end\ndata: [DONE]\n\n`);
  writer.end();
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function streamFallbackMessageJump(writer: ServerResponse, message: string) {
  const maxChunkLength = 300;

  // 1. \n 기준으로 문단 단위로 쪼갬
  const paragraphs = message.split('\n');

  for (const paragraph of paragraphs) {
    let start = 0;
    while (start < paragraph.length) {
      // 2. 300자씩 쪼갬
      const chunk = paragraph.slice(start, start + maxChunkLength);
      writer.write(`data: ${chunk}\n\n`);
      await sleep(2); // 10ms 정도가 안정적
      start += maxChunkLength;
    }

    // 문단 간 줄바꿈도 표시
    writer.write(`data: \n\n`);
    await sleep(2);
  }
}

export async function streamFallbackMessageJumpBedrock(writer: ServerResponse, messages: ClaudeMessage[]) {
  
  const command = new InvokeModelWithResponseStreamCommand({
    modelId: 'arn:aws:bedrock:us-east-1:333888904784:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0', 
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

  let bufferText = '';

  for await (const chunk of response.body) {
    try {
      // chunk는 이미 JS 객체
      const base64 = chunk?.chunk?.bytes;
      if (!base64) continue;

      const buffer = Buffer.from(base64, 'base64');
      const data = JSON.parse(buffer.toString('utf-8')); // 실제 Claude 메시지

      const completion = data.completion ?? data.delta?.text ?? '';
      if (completion) {
        bufferText += completion;

        // 일정 길이 이상 쌓이면 flush
        if (bufferText.length >= 10 || completion.includes('\n')) {
          writer.write(`data: ${bufferText}\n\n`);
          bufferText = '';
        }
      }
    } catch (err) {
      console.error('스트림 처리 중 오류:', err);
      continue;
    }
  }

  // 루프 종료 시 남은 텍스트도 전송
  if (bufferText.length > 0) {
    writer.write(`data: ${bufferText}\n\n`);
  }

}