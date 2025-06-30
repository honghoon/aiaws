import { streamClaudeResponse , streamFallbackMessage } from '~/server/utils/bedrock_stream';
import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scenarios } from '~/server/templates/scenarios.js';
import { corp_card_scenarios_end} from '~/server/templates/corp_card_scenarios_end.js';
import { corp_card_scenarios } from '~/server/templates/corp_card_scenarios.js';
import { send1Proc } from '~/server/api/erp/result1Proc';
import { send2Proc } from '~/server/api/erp/result2Proc';
import { send3Proc } from '~/server/api/erp/result3Proc';
import { send6Proc } from '~/server/api/erp/result6Proc';

const messgageKey = "\n--message--\n";
const prockey = "\n--proc--\n";
const jsonKey = "\n--json--\n";

export default defineEventHandler(async (event) => {
  const { prompt } = await readBody(event);
  const today = new Date().toISOString().split('T')[0]; // "2025-06-26"

  setResponseHeaders(event, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

  const writer = event.node.res;

  // 현재 질문과, 과거 질문을 가져오기
  let history = "";
  let toMessage = "";

  for (let i = 0; i < prompt.length; i++) {
    const item = prompt[i];

    // 마지막 user 메시지를 현재 메시지로
    if (i === prompt.length - 1 && item.role === "user") {
      toMessage = item.content;
    } else {
      // history는 "User: ..." 또는 "Assistant: ..." 형식으로 정리
      const speaker = item.role === "user" ? "user" : "assistant";
      history += `${speaker}: ${item.content}\n`;
    }
  }

  let messages = scenarios
    .replace('{history}', history)
    .replace('{toMessage}', toMessage);

  // 프롬프트 객체 생성
  let sendPrompt = [{"role": "user", "content" : messages}]
  
  await streamFallbackMessageJump(writer, prockey)
  await streamFallbackMessageJump(writer, '의도를 분석하고 있습니다.\n')

  // 의도 분류 요청
  let resultInvoke= await sendClaudeResponseInvoke(sendPrompt)

  // 문자나,, 기타 이상한 답변을 할 수 있으므로,, 숫자로 치환
  const intent = resultInvoke["completion"].match(/\b[0-6]\b/);
  const result = intent ? parseInt(intent[0], 10) : 0;

  // 0은 시나리오에 없으므로 아래와 같이 답변하여 챗팅을 종료한다.
  if (result === 0) {
    await streamFallbackMessageJump(writer, messgageKey)
    await streamFallbackMessageJump(writer, '죄송합니다. 해당 요청은 지원되지 않거나 인식할 수 없습니다.\n')
    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    return;
  }

  if (result === 1) {
    await send1Proc(writer, history, toMessage);
    return
  }else if (result === 2) {
    await send2Proc(writer, history, toMessage);
    return
  }else if (result === 3) {
    await send3Proc(writer, history, toMessage);
    return
  }else if (result === 6) {
    await send6Proc(writer, history, toMessage);
    return
  }

  // 최종 스트림 데이터
  //await streamClaudeResponse(prompt, event);
  await streamFallbackMessageJump(writer, messgageKey)
  await streamFallbackMessageJump(writer, '죄송합니다. 해당 요청은 지원되지 않거나 인식할 수 없습니다.\n')
  writer.write(`event: end\ndata: [DONE]\n\n`);
  writer.end();
});
