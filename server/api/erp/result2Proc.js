
import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { corp_card_scenarios_end} from '~/server/templates/corp_card_scenarios_end.js';
import { corp_card_scenarios_reg } from '~/server/templates/corp_card_scenarios_reg.js';

const messgageKey = "\n--message--\n";
const prockey = "\n--proc--\n";
const jsonKey = "\n--json--\n";

export const send2Proc = async (writer, history, toMessage) => {
    const today = new Date().toISOString().split('T')[0]; // "2025-06-26"
   let messages = corp_card_scenarios_reg
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

        // 의도와 다르게 쿼리를 작성하는 경우 가 있어 한번 더 판단
        // slipNumber 키 제거 로직
        const has7700Prefix = /7700\d*/.test(toMessage);
        if (!has7700Prefix) {
          delete queryObj.query.slipNumber;
        }

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
        "type":"table_edit",
        "data":formattedResult,
        "scenrios":2,
        "columns": corporate_cardsColumns,
        "title": "법인카드 전표 상신",
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
    width: 200,
    type: 'select',
    optionLabel: 'name',
    optionValue: 'code',
    options: [
      { name: '복리후생비(운영비)', code: '50000000' },
      { name: '복리후생비(특근식대)', code: '50000001' },
      { name: '여비교통비(시내,외)', code: '50000002' },
      { name: '프로젝트영업제안비', code: '50000003' },
      { name: '영업활동비(기타)', code: '50000004' },
      { name: '교육훈련비', code: '50000004' },
      { name: '광고선전비', code: '50000005' }
    ]
  },
  {
    title: '코스트센터',
    key: 'costCenter',
    width: 200,
    type: 'select',
    optionLabel: 'name',
    optionValue: 'code',
    options: [
      { name: 'CEO', code: '10000' },
      { name: '임원', code: '10001' },
      { name: '전사공통', code: '10002' },
      { name: '기획팀', code: '11000' },
      { name: '전략팀', code: '11001' },
      { name: '인사팀', code: '11002' },
      { name: 'ERP1사업본부', code: '12000' },
      { name: 'ERP2사업본부', code: '12001' },
      { name: 'ERP3사업본부', code: '12002' },
      { name: '모빌리티사업본부', code: '12003' },
      { name: '클라우드사업본부', code: '12004' },
      { name: '클라우드서비스팀', code: '12100' },
      { name: '클라우드기술팀', code: '12101' },
      { name: '클라우드전략고객팀', code: '12102' },
      { name: 'MS서비스팀', code: '12103' },
      { name: 'CIT사업본부', code: '12005' },
      { name: 'VC사업본부', code: '12006' }
    ]
  },
  {
    title: 'WBS',
    key: 'wbsElement',
    width: 200,
    type: 'select',
    optionLabel: 'name',
    optionValue: 'code',
    options: [
      { name: '바디프렌드 ERP 프로젝트', code: 'W-05-54386' },
      { name: '트렉스타 그룹웨어 프로젝트', code: 'W-03-48580' },
      { name: '웅진식품 NCP 프로젝트', code: 'W-03-48581' }
    ]
  },
  {
    title: '사용내역',
    key: 'description',
    width: 200,
    type: 'input',
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
