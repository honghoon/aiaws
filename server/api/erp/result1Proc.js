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

    // 마지막 결과 Data Set JSON 반환
    let sendResponseData = {
        "type":"table",
        "data":formattedResult,
        "scenrios":1,
        "columns": corporate_cardsColumns,
        "title": "법인카드 전표 데이터",
    }

    await streamFallbackMessageJump(writer, jsonKey)
    await streamFallbackMessageJump(writer, JSON.stringify(sendResponseData))

    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    console.log(resultDataSet)
}

const corporate_cardsColumns = [
  {
    title: '전표번호',
    key: 'slipNumber',
    width: 120,
    fixed: 'left'
  },
  {
    title: '사용일자',
    key: 'usageDate',
    width: 120
  },
  {
    title: '상호',
    key: 'merchantName',
    width: 150,
  },
  {
    title: '금액',
    key: 'amount',
    width: 100,
    type: 'amount'
  },
  {
    title: '부가세',
    key: 'taxAmount',
    width: 100,
    type: 'amount'
  },
  {
    title: '계정과목',
    key: 'glAccount',
    width: 100,
  },
  {
    title: '코스트센터',
    key: 'costCenter',
    type :"edit",
    width: 100,
  },
  {
    title: 'WBS',
    key: 'wbsElement',
    width: 100,
  },
  {
    title: '사용내역',
    key: 'description',
    width: 200,
  },
  {
    title: '회사코드',
    key: 'companyCode',
    width: 120
  },
  {
    title: '등록자',
    key: 'createdBy',
    width: 120,
  }
  
]

function parseMongoQueryFromText(queryText) {
  try {
    // ISODate("...") → "..." 로 치환
    const cleaned = queryText
      .replace(/ISODate\("(.*?)"\)/g, '"$1"')   // ISODate 제거 → 문자열 처리
      .replace(/\/\/.*$/gm, '');                // 주석 제거

    return JSON.parse(cleaned);
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
