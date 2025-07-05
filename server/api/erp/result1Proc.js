import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { corp_card_scenarios_end} from '~/server/templates/corp_card_scenarios_end.js';
import { corp_card_scenarios } from '~/server/templates/corp_card_scenarios.js';

const messgageKey = "\n--message--\n";
const prockey = "\n--proc--\n";
const jsonKey = "\n--json--\n";

export const send1Proc = async (writer, history, toMessage) => {
    const today = new Date().toISOString().split('T')[0]; // "2025-06-26"
   let messages = corp_card_scenarios
        .replace('{history}', history)
        .replace('{toMessage}', toMessage)
        .replace('{today}', today);

    let sendPrompt = [{"role": "user", "content" : messages}]    

    await streamFallbackMessageJump(writer, prockey)
    await streamFallbackMessageJump(writer, '쿼리를 생성하고 있습니다.\n')

    let resultInvoke= await sendClaudeResponseInvoke(sendPrompt)
    const queryText = resultInvoke.completion;

    const queryObj = parseMongoQueryFromText(queryText);
    const db = await getDatabase();
    let formattedResult = [];

    let resultDataSet = null;
    let resultDataCount = null;
    let returnType = null;
    let sendResponseData = null;

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

        returnType = "table";
        sendResponseData = {
          "type":returnType,
          "data":formattedResult,
          "scenrios":1,
          "columns": corporate_cardsColumns,
          "visualization":queryObj.visualization,
          "title": "법인카드 전표 데이터"
        }

    }else if (queryObj.visualizationType === 'linechart' || queryObj.visualizationType === 'barchart'){
        await streamFallbackMessageJump(writer, prockey)
        await streamFallbackMessageJump(writer, '데이터를 조회하고 있습니다.\n')

        resultDataSet = await db.collection('corporate_cards').aggregate(queryObj.aggregate).toArray();
        console.log(resultDataSet)

        formattedResult = resultDataSet.map(doc => ({
        ...doc,
        usageDate: doc._id
        }));
        
        returnType = "chart";
        sendResponseData = {
          "type":returnType,
          "data":formattedResult,
          "scenrios":1,
          "visualization":queryObj.visualization,
          "chartType":"bar"
        }
    
    }else if (queryObj.visualizationType === 'form'){
        await streamFallbackMessageJump(writer, prockey)
        await streamFallbackMessageJump(writer, '데이터를 조회하고 있습니다.\n')

        resultDataSet = await db.collection('corporate_cards').find(queryObj.query).toArray();

        
        formattedResult = resultDataSet.map(doc => ({
        ...doc
        }));
        

        returnType = "form";
        sendResponseData = {
          "type":returnType,
          "modelValue":formattedResult[0],
          "scenrios":1,
          "schema": corporate_cardsColumns,
          "title": "법인카드 전표 상세정보"
        }
    
    }

    if (formattedResult == null || formattedResult.length == 0){
        await streamFallbackMessageJump(writer, messgageKey)
        await streamFallbackMessageJump(writer, '데이터가 존재하지 않습니다.\n')
        writer.write(`event: end\ndata: [DONE]\n\n`);
        writer.end();
        return;
    }

    messages = corp_card_scenarios_end
        .replace('{history}', history)
        .replace('{toMessage}', toMessage)
        .replace('{today}', today)
        .replace('{query}', queryText)
        .replace('{resultCount}', resultDataCount)
        .replace('{results}', JSON.stringify(formattedResult, null, 2));

    console.log(messages)
    sendPrompt = [{"role": "user", "content" : messages}]

    await streamFallbackMessageJump(writer, messgageKey)
    // bedrock 스트림으로 결과 답변 요청 stream 실행
    await streamFallbackMessageJumpBedrock(writer, sendPrompt)

    /*
    // 마지막 결과 Data Set JSON 반환
    let sendResponseData = {
        "type":returnType,
        "data":formattedResult,
        "scenrios":1,
        "columns": corporate_cardsColumns,
        "title": "법인카드 전표 데이터",
    }*/

    await streamFallbackMessageJump(writer, jsonKey)
    await streamFallbackMessageJump(writer, JSON.stringify(sendResponseData))

    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    console.log(resultDataSet)
}

const corporate_cardsColumns = [
  {
    title: '전표번호',
    label: '전표번호',
    type: 'text',
    key: 'slipNumber',
    width: 120,
    fixed: 'left',
    edit: false
  },
  {
    title: '사용일자',
    label: '사용일자',
    type: 'text',
    key: 'usageDate',
    width: 120,
    edit: false
  },
  {
    title: '상호',
    label: '상호',
    type: 'text',
    key: 'merchantName',
    width: 150,
    edit: false
  },
  {
    title: '금액',
    label: '금액',
    type: 'text',
    key: 'amount',
    width: 100,
    type: 'amount',
    edit: false
  },
  {
    title: '부가세',
    label: '부가세',
    type: 'text',
    key: 'taxAmount',
    width: 100,
    type: 'amount',
    edit: false
  },
  {
    title: '계정과목',
    label: '계정과목',
    type: 'text',
    key: 'glAccount',
    width: 100,
    edit: false
  },
  {
    title: '코스트센터',
    label: '코스트센터',
    type: 'text',
    key: 'costCenter',
    type :"edit",
    width: 100,
    edit: false
  },
  {
    title: 'WBS',
    label: 'WBS',
    type: 'text',
    key: 'wbsElement',
    width: 100,
    edit: false
  },
  {
    title: '사용내역',
    label: '사용내역',
    type: 'text',
    key: 'description',
    width: 200,
    edit: false
  },
  {
    title: '회사코드',
    label: '회사코드',
    type: 'text',
    key: 'companyCode',
    width: 120,
    edit: false
  },
  {
    title: '등록자',
    label: '등록자',
    type: 'text',
    key: 'createdBy',
    width: 120,
    edit: false
  }
  
]

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
    console.log("✅ 최종 파싱 결과:", final);
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
