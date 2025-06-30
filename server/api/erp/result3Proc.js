
import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { corp_card_scenarios_end} from '~/server/templates/corp_card_scenarios_end.js';
import { corp_card_scenarios_reg } from '~/server/templates/corp_card_scenarios_reg.js';

const messgageKey = "\n--message--\n";
const prockey = "\n--proc--\n";
const jsonKey = "\n--json--\n";

export const send3Proc = async (writer, history, toMessage) => {


    // 마지막 결과 Data Set JSON 반환
    let sendResponseData = {
        "type":"form",
        "modelValue":formModel,
        "scenrios":3,
        "schema": schema,
        "title": "테스트 폼",
    }

    await streamFallbackMessageJump(writer, jsonKey)
    await streamFallbackMessageJump(writer, JSON.stringify(sendResponseData))

    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    console.log(resultDataSet)
}

const formModel = {
  name: '짜지훈',
  age: null,
  email: '',
  gender: '',
  interests: [],     // ✅ multiple select
  bio: '',
  joinDate: null     // ✅ date
}

const schema = [
  {
    label: '이름',
    key: 'name',
    type: 'text',
    required: true,
    placeholder: '이름을 입력하세요'
  },
  {
    label: '나이',
    key: 'age',
    type: 'number',
    required: true,
    placeholder: '숫자만 입력'
  },
  {
    label: '이메일',
    key: 'email',
    type: 'text',
    placeholder: 'example@domain.com'
  },
  {
    label: '성별',
    key: 'gender',
    type: 'select',
    required: true,
    options: [
      { label: '남성', value: 'male' },
      { label: '여성', value: 'female' },
      { label: '기타', value: 'other' }
    ]
  },
  {
    label: '관심사',
    key: 'interests',
    type: 'select',
    multiple: true,
    options: [
      { label: '프로그래밍', value: 'dev' },
      { label: '음악', value: 'music' },
      { label: '스포츠', value: 'sports' }
    ],
    placeholder: '하나 이상 선택'
  },
  {
    label: '소개',
    key: 'bio',
    type: 'textarea',
    placeholder: '자기소개를 입력하세요'
  },
  {
    label: '가입일',
    key: 'joinDate',
    type: 'date'
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
