import { streamClaudeResponse , streamFallbackMessage } from '~/server/utils/bedrock_stream';
import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  // scenarios.txt 의 의도를 분석하기 위한 프롬프트 가져오기
  let filePath = path.join(process.cwd(), 'server/api/erp/scenarios.txt');
  let messages = fs.readFileSync(filePath, 'utf-8')
    .replace('${history}', history)
    .replace('${toMessage}', toMessage);

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
    // return streamFallbackMessage(event, '법인 카드는 짜형이 올려야지!');
    
    filePath = path.join(process.cwd(), 'server/api/erp/corp_card_scenarios.txt');
    messages = fs.readFileSync(filePath, 'utf-8')
      .replace('${history}', history)
      .replace('${toMessage}', toMessage)
      .replace('${today}', today);

    sendPrompt = [{"role": "user", "content" : messages}]

    await streamFallbackMessageJump(writer, prockey)
    await streamFallbackMessageJump(writer, '쿼리를 생성하고 있습니다.\n')

    resultInvoke= await sendClaudeResponseInvoke(sendPrompt)
    const queryText = resultInvoke.completion;

    const queryObj = parseMongoQueryFromText(queryText);
    const db = await getDatabase();
    let formattedResult = [];

    let resultDataSet = null;
    let resultDataCount = null;

    if (queryObj.visualizationType === 'table'){
      await streamFallbackMessageJump(writer, prockey)
      await streamFallbackMessageJump(writer, '데이터를 조회하고 있습니다.\n')

      resultDataSet = await db.collection('corporate_cards').find(queryObj.query).toArray();

      formattedResult = resultDataSet.map(doc => ({
        ...doc,
        usageDate: formatDate(doc.usageDate),
        createdAt: formatDate(doc.createdAt),
        updatedAt: formatDate(doc.updatedAt),
        amount: formatAmount(doc.amount),
        taxAmount: formatAmount(doc.taxAmount),
      }));

      console.log(resultDataSet)
      resultDataCount = await db.collection('corporate_cards').countDocuments(queryObj.count);
      console.log(resultDataCount)
    }

    if (formattedResult == null || formattedResult.length == 0){
      await streamFallbackMessageJump(writer, messgageKey)
      await streamFallbackMessageJump(writer, '데이터가 존재하지 않습니다.\n')
      writer.write(`event: end\ndata: [DONE]\n\n`);
      writer.end();
      return;
    }

    filePath = path.join(process.cwd(), 'server/api/erp/corp_card_scenarios_end.txt');
    messages = fs.readFileSync(filePath, 'utf-8')
      .replace('${history}', history)
      .replace('${toMessage}', toMessage)
      .replace('${today}', today)
      .replace('${query}', queryText)
      .replace('${resultCount}', resultDataCount)
      .replace('${results}', JSON.stringify(formattedResult, null, 2));

    console.log(messages)
    sendPrompt = [{"role": "user", "content" : messages}]

    await streamFallbackMessageJump(writer, messgageKey)
    // bedrock 스트림으로 결과 답변 요청 stream 실행
    await streamFallbackMessageJumpBedrock(writer, sendPrompt)

    // 마지막 결과 Data Set JSON 반환

    let sendResponseData = {
      "type":"table",
      "data":formattedResult,
      "scenrios":1
    }

    await streamFallbackMessageJump(writer, jsonKey)
    await streamFallbackMessageJump(writer, JSON.stringify(sendResponseData))

    // const queryObj = eval(`(${queryText})`);
    // const resultDataSet = await db.collection('corporate_cards').find(queryObj).toArray();
    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    console.log(resultDataSet)

  }
  // 최종 스트림 데이터
  //await streamClaudeResponse(prompt, event);

});

function parseMongoQueryFromText(queryText) {
  try {
    const fn = new Function(`return (${queryText});`);
    return fn();
  } catch (e) {
    console.error('⚠️ MongoDB 쿼리 파싱 실패:', e.message);
    return {};
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0]; // yyyy-mm-dd
}

function formatAmount(value) {
  return value.toLocaleString(); // 세 자리 콤마
}
