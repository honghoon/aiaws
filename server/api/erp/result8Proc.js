import { sendClaudeResponseInvoke } from  '~/server/utils/bedrock_invoke';
import { sales_order_detail} from '~/server/templates/sales_order_detail.js';
import { sales_order_modify} from '~/server/templates/sales_order_modify';
import { sales_order_select_end} from '~/server/templates/sales_order_select_end.js';

const messgageKey = "\n--message--\n";
const prockey = "\n--proc--\n";
const jsonKey = "\n--json--\n";

export const send8Proc = async (writer, history, toMessage) => {

  const today = new Date().toISOString().split('T')[0]; // "2025-06-26"
  let messages = sales_order_detail
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
  
  const orderNumber = queryObj.orderNumber;
  const query = {
    queryType: "aggregate",
    collection: "sales_orders",
    pipeline: [
      {
        $match: { orderNumber }
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerCode",
          foreignField: "customerCode",
          as: "customer"
        }
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "products",
          let: { productCodes: "$lineItems.productCode" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$productCode", "$$productCodes"]
                }
              }
            }
          ],
          as: "products"
        }
      },
      { $limit: 1 }
    ]
  };

  const db = await getDatabase(); // MongoDB 커넥션 획득
  const resultDataSet = await db
    .collection(query.collection)
    .aggregate(query.pipeline)
    .toArray();

  console.log("resultDataSet", resultDataSet)

  let formattedResult = resultDataSet;

  
  console.log("분석 쿼리 실행 결과 Mongo DB Result Set: ", formattedResult)
  console.log("기준 쿼리 정보", queryObj)

  if (!formattedResult || formattedResult.length === 0) {
    await streamFallbackMessageJump(writer, messgageKey);
    await streamFallbackMessageJump(writer, '데이터가 존재하지 않습니다.\n');
    writer.write(`event: end\ndata: [DONE]\n\n`);
    writer.end();
    return;
  }

  // 제품정보 조회
  const productDataSet = await db
    .collection("products").find({}).toArray()

  messages = sales_order_modify
      .replace('{history}', history)
      .replace('{toMessage}', toMessage)
      .replace('{today}', today)
      .replace('{products}', JSON.stringify(productDataSet, null, 2))
      .replace('{orignData}', JSON.stringify(formattedResult, null, 2));

  sendPrompt = [{"role": "user", "content" : messages}]   

  await streamFallbackMessageJump(writer, prockey)
  await streamFallbackMessageJump(writer, '데이터를 분석하고 있습니다. 잠시만 기달려주세요.')

  let resultModiyData;

  try{
    resultInvoke= await sendClaudeResponseInvoke(sendPrompt)
    resultModiyData = resultInvoke.completion;
  }catch(e){
    await streamFallbackMessageJump(writer, "--error--")
    await streamFallbackMessageJump(writer, e)
    return
  }

  resultModiyData = resultModiyData
    .replace(/```json\s*/gi, '')  // 시작 태그 제거
    .replace(/```/g, '');         // 종료 태그 제거

  let resultModiyJSON;
  try{
    resultModiyJSON = JSON.parse(resultModiyData)
  }catch(e){
    await streamFallbackMessageJump(writer, "--error--")
    await streamFallbackMessageJump(writer, '데이터 변환에 실패하였습니다.')
    await streamFallbackMessageJump(writer, e)
    return
  }

  let updatedOrder
  
  try{
    updatedOrder = applyPatchToOrder(formattedResult[0], resultModiyJSON, productDataSet);
  }catch(e){
    await streamFallbackMessageJump(writer, "--error--")
    await streamFallbackMessageJump(writer, '데이터 변환에 실패하였습니다.')
    await streamFallbackMessageJump(writer, e)
    return
  }
  

  console.log("## 변환 완료 ##" , updatedOrder)

  const addPromt = " 아래와 같이 데이터를 적용 하였습니다.(저장되지는 않음) \n (필수) 아래 저장 버튼을 클릭하여야 저장됩니다. 답변으로 꼭 저장하라는 메시지를 강조하여 답변하세요. \n 만약 할인이 10% 이상 되면 웅진 PMS에서 VRB 및 전자결재가 필요합니다. "
  messages = sales_order_select_end
          .replace('{history}', history)
          .replace('{toMessage}', toMessage)
          .replace('{today}', today)
          .replace('{results}', addPromt + JSON.stringify(resultModiyJSON, null, 2));

  sendPrompt = [{"role": "user", "content" : messages}]

  await streamFallbackMessageJump(writer, messgageKey)
  // bedrock 스트림으로 결과 답변 요청 stream 실행
  await streamFallbackMessageJumpBedrock(writer, sendPrompt)

  // 마지막 결과 Data Set JSON 반환
  let sendResponseData = {
      "type":"form_edit",
      "modelValue":updatedOrder,
      "scenrios":3,
      "schema": schema,
      "title": queryObj.title,
      "lineItemSections": product_colums
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

const schema = [
  {
    label: '주문번호',
    key: 'orderNumber',
    type: 'text',
    required: true,
    placeholder: '주문번호를 입력하세요',
    edit:false
  },
  {
    label: '주문일자',
    key: 'orderDate',
    type: 'date',
    required: true,
  },
  {
    label: '고객명',
    key: 'customerName',
    type: 'text',
    edit:false
  },
  {
    label: '상태',
    key: 'status',
    type: 'select',
    required: true,
    options: [
      { label: '확정', value: 'Confirmed' },
      { label: '납풉완료', value: 'Delivered' },
      { label: '진행중', value: 'Open' }
    ],
  },
  {
    label: '납기 예정일',
    key: 'deliveryDate',
    type: 'date'
  },
  {
    label: '결재 조건',
    key: 'paymentTerm',
    type: 'text'
  },
  {
    label: '공급가액 합계',
    key: 'totalAmount',
    type: 'text',
    dataType: 'amount',
    edit:false
  },
  {
    label: '총 세액',
    key: 'totalTax',
    type: 'text',
    dataType: 'amount',
    edit:false
  }
  
]

const product_colums = [
  {
    "key": "lineItems",
    "title":"* 제품정보",
    "columns":[
      {
        title: 'id',
        key: 'itemNumber',
        width: 40,
        fixed: 'left'
      },
      {
        title: '품목 코드',
        key: 'productCode',
        width: 60,
        fixed: 'left'
      },
      {
        title: '품목명',
        key: 'productName',
        width: 100
      },
      {
        title: '수량',
        key: 'quantity',
        width: 40,
        fixed: 'left'
      },
      {
        title: '단가',
        key: 'unitPrice',
        width: 100,
        type:"amount",
        fixed: 'left'
      },
      {
        title: '세액',
        key: 'taxAmount',
        width: 100,
        type:"amount",
        fixed: 'left'
      },
      {
        title: '세율',
        key: 'taxRate',
        width: 40,
        type:"amount",
        fixed: 'left'
      },
    ]
  }
] 

function applyPatchToOrder(originalData, patchList, products) {
  const cloned = structuredClone(originalData); // 원본 보호

  for (const patch of patchList) {
    const { type, key, value } = patch;

    if (!key) continue;

    const path = key.replace(/\[(\d+)\]/g, '.$1').split('.');
    let target = cloned;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!(segment in target)) {
        target[segment] = /^\d+$/.test(path[i + 1]) ? [] : {};
      }
      target = target[segment];
    }

    const lastKey = path[path.length - 1];

    // 🔁 수정
    if (type === 'M') {
      target[lastKey] = value;
    }

    // ➕ 추가 (lineItems 에 제품 추가)
    else if (type === 'A' && key === 'lineItems') {
      const { productCode, quantity } = value;

      const product = products.find(p => p.productCode === productCode);
      if (!product) {
        console.warn(`❗제품코드 ${productCode} 를 products 목록에서 찾을 수 없습니다.`);
        continue;
      }

      const taxAmount = Math.round(product.standardPrice * quantity * product.taxRate);
      const amount = product.standardPrice * quantity;

      const newItem = {
        itemNumber: target.length > 0 ? (Math.max(...target.map(i => i.itemNumber)) + 10) : 10,
        productCode: product.productCode,
        productName: product.productName,
        quantity,
        uom: product.uom,
        unitPrice: product.standardPrice,
        amount,
        taxRate: product.taxRate,
        taxAmount
      };

      target.push(newItem);
    }

    // ➖ 삭제 (lineItems[n] 삭제)
    else if (type === 'D' && path[0] === 'lineItems') {
      const index = parseInt(path[1]);
      if (!isNaN(index) && Array.isArray(cloned.lineItems)) {
        cloned.lineItems.splice(index, 1);
      }
    }
  }

  // 💰 총액 재계산
  if (Array.isArray(cloned.lineItems)) {
    const totalAmount = cloned.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = cloned.lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    cloned.totalAmount = totalAmount;
    cloned.totalTax = totalTax;
    cloned.grandTotal = totalAmount + totalTax;
  }

  return cloned;
}