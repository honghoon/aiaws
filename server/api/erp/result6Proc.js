import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { sales_order_select} from '~/server/templates/sales_order_select.js';
import { sales_order_select_end} from '~/server/templates/sales_order_select_end.js';

const messgageKey = "\n--message--\n";
const prockey = "\n--proc--\n";
const jsonKey = "\n--json--\n";

export const send6Proc = async (writer, history, toMessage) => {

  const today = new Date().toISOString().split('T')[0]; // "2025-06-26"
  let messages = sales_order_select
      .replace('{history}', history)
      .replace('{toMessage}', toMessage)
      .replace('{today}', today);

  let sendPrompt = [{"role": "user", "content" : messages}]   

  await streamFallbackMessageJump(writer, prockey)
  await streamFallbackMessageJump(writer, '쿼리를 생성하고 있습니다.\n')

  let resultInvoke= await sendClaudeResponseInvoke(sendPrompt)
  const queryText = resultInvoke.completion;
  console.log("[LLM 쿼리 결과]", queryText);

  const queryObj = parseMongoQueryFromText(queryText);
  const db = await getDatabase();
  let formattedResult = [];

  let resultDataSet = null;
  let resultDataCount = null;

  console.log("query", queryObj)

  if (queryObj.queryType === 'find') {
    resultDataSet = await db.collection(queryObj.collection).find(queryObj.filter || {}, {
      projection: queryObj.projection || {}
    }).toArray();
  } else if (queryObj.queryType === 'aggregate') {
    resultDataSet = await db.collection(queryObj.collection).aggregate(queryObj.pipeline || []).toArray();
  }

  formattedResult = resultDataSet;

  console.log("분석 쿼리 실행 결과 Mongo DB Result Set: ", formattedResult)
  console.log("기준 쿼리 정보", queryObj)

  if (!formattedResult || formattedResult.length === 0) {
    await streamFallbackMessageJump(writer, messgageKey);
    await streamFallbackMessageJump(writer, '데이터가 존재하지 않습니다.\n');
    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    return;
  }

  messages = sales_order_select_end
          .replace('{history}', history)
          .replace('{toMessage}', toMessage)
          .replace('{today}', today)
          .replace('{results}', JSON.stringify(formattedResult, null, 2));
  

  console.log(messages)

  sendPrompt = [{"role": "user", "content" : messages}]

  await streamFallbackMessageJump(writer, messgageKey)
  // bedrock 스트림으로 결과 답변 요청 stream 실행
  await streamFallbackMessageJumpBedrock(writer, sendPrompt)

  const sendResponseData = {
    type: "chart",
    data: formattedResult,
    columns: [],
    chartType: queryObj.visualization?.type || "",
    title: queryObj.visualization?.title || '',
    xField: queryObj.visualization?.xField,
    yField: queryObj.visualization?.yField
  };


  console.log("sendResponseData", sendResponseData)

  await streamFallbackMessageJump(writer, jsonKey)
  await streamFallbackMessageJump(writer, JSON.stringify(sendResponseData))

  writer.write(`event: end\ndata: [DONE]\n\n`);
  writer.end();
  console.log(resultDataSet)
}

function parseMongoQueryFromText(queryText) {
  console.log("=== 쿼리 파서 시작 ===");

  try {
    // 1단계: ISODate(...) / new Date(...) → "yyyy-mm-dd"
    const cleaned = queryText
      .replace(/\/\/.*$/gm, '') // 한 줄 주석 제거
      .replace(/\/\*[\s\S]*?\*\//g, '') // 멀티라인 주석 제거
      .replace(/(ISODate|new Date)\(\s*["'](.*?)["']\s*\)/g, '"$2"'); // 날짜 표현을 문자열로 변환

    // 2단계: 문자열로 JSON 파싱
    const parsed = JSON.parse(cleaned);

    // 3단계: 모든 객체를 순회하며 ISO date string을 Date 객체로 재변환
    const convertDates = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      } else if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T?\d{0,2}:?\d{0,2}?:?\d{0,2}?(\.\d+)?Z?$/.test(obj[key])) {
            const date = new Date(obj[key]);
            if (!isNaN(date.getTime())) {
              obj[key] = date;
            }
          } else if (typeof obj[key] === 'object') {
            obj[key] = convertDates(obj[key]);
          }
        }
      }
      return obj;
    };

    const final = convertDates(parsed);
    console.log("✅ 구조 확인용 JSON:", JSON.stringify(parsed, null, 2));
    return final;

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
