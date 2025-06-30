import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { sales_order_select} from '~/server/templates/sales_order_select.js';

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

  if (queryObj.queryType === 'find') {
    resultDataSet = await db.collection(queryObj.collection).find(queryObj.filter || {}, {
      projection: queryObj.projection || {}
    }).toArray();
  } else if (queryObj.queryType === 'aggregate') {
    resultDataSet = await db.collection(queryObj.collection).aggregate(queryObj.pipeline || []).toArray();
  }

  formattedResult = resultDataSet;

  if (!formattedResult || formattedResult.length === 0) {
    await streamFallbackMessageJump(writer, messgageKey);
    await streamFallbackMessageJump(writer, '데이터가 존재하지 않습니다.\n');
    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    return;
  }

  const sendResponseData = {
    type: queryObj.visualization?.type || 'table',
    data: formattedResult,
    columns: [],
    title: queryObj.visualization?.title || '',
    xField: queryObj.visualization?.xField,
    yField: queryObj.visualization?.yField
  };





  await streamFallbackMessageJump(writer, jsonKey)
  await streamFallbackMessageJump(writer, JSON.stringify(sendResponseData))

  writer.write(`event: end\ndata: [DONE]\n\n`);
  writer.end();
  console.log(resultDataSet)
}

function parseMongoQueryFromText(queryText) {
  try {
    // ISODate → new Date 변환
    let sanitized = queryText.replace(/ISODate\((.*?)\)/g, 'new Date($1)');

    // // 주석 제거
    sanitized = sanitized.replace(/\/\/.*$/gm, '');

    const fn = new Function(`return (${sanitized});`);
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
