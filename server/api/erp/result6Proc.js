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

  try {
    if (queryObj.queryType === 'find') {
      resultDataSet = await db.collection(queryObj.collection).find(queryObj.filter || {}, {
        projection: queryObj.projection || {}
      }).toArray();
    } else if (queryObj.queryType === 'aggregate') {
      resultDataSet = await db.collection(queryObj.collection).aggregate(queryObj.pipeline || []).toArray();
    }
  }catch(e){
    console.log("## 몽코 디비 실행 오류 ", e)
  }

  try{

    let testData = await db.collection(queryObj.collection).aggregate([
    {
      $match: {
        orderDate: {
          $gte: new Date("2025-06-01T00:00:00.000Z"),
          $lte: new Date("2025-06-30T23:59:59.999Z")
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$orderDate" },
          month: { $month: "$orderDate" },
          day: { $dayOfMonth: "$orderDate" }
        },
        totalAmount: { $sum: "$grandTotal" },
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  console.log("test Data", testData)

  }catch(e){
    console.log(e)
  }

  console.log(queryObj)
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

  let sendResponseData = null;

  if(queryObj.visualization?.type != "table"){
    sendResponseData = {
      type: "chart",
      data: formattedResult,
      columns: [],
      chartType: queryObj.visualization?.type || "",
      title: queryObj.visualization?.title || '',
      xField: queryObj.visualization?.xField,
      yField: queryObj.visualization?.yField
    }
  }else{
    try{
      sendResponseData = {
        type: "table",
        data: formattedResult || [],
        scenrios: 1,
        columns: queryObj.visualization?.schema || [],
        title: queryObj.visualization?.title || ''
      }
    }catch(e){
      console.log(e)
    }
  }

  console.log("sendResponseData", sendResponseData)

  await streamFallbackMessageJump(writer, jsonKey)
  await streamFallbackMessageJump(writer, JSON.stringify(sendResponseData))

  writer.write(`event: end\ndata: [DONE]\n\n`);
  writer.end();
  console.log(resultDataSet)
}

function parseMongoQueryFromText(queryText) {
  console.log("=== 쿼리 파서 시작 ===");

  // 0단계: 코드 블록 제거 - ```json ... ``` 또는 ``` 제거
  queryText = queryText
    .replace(/```json\s*/gi, '')  // 시작 태그 제거
    .replace(/```/g, '');         // 종료 태그 제거

  try {
    // 1단계: 주석 및 ISODate/new Date 포맷 정리
    const cleaned = queryText
      .replace(/\/\/.*$/gm, '')                         // 한 줄 주석 제거
      .replace(/\/\*[\s\S]*?\*\//g, '')                 // 멀티라인 주석 제거
      .replace(/(ISODate|new Date)\(\s*["'](.*?)["']\s*\)/g, '"$2"'); // 날짜 문자열로 치환

    // 2단계: JSON 파싱
    const parsed = JSON.parse(cleaned);

    // 3단계: 날짜 문자열 또는 { "$date": "..." } → Date 객체로 변환
    const convertDates = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      } else if (obj && typeof obj === 'object') {
        // $date 단일 키 처리: { "$date": "..." }
        if (Object.keys(obj).length === 1 && '$date' in obj && typeof obj['$date'] === 'string') {
          const date = new Date(obj['$date']);
          return isNaN(date.getTime()) ? obj : date;
        }

        // 일반적인 재귀 처리
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
    console.log("✅ 구조 확인용 JSON:", JSON.stringify(final, null, 2));
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
