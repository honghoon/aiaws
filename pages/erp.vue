<template>
  <div class="relative">
    <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
      
      <div class="min-h-[calc(100vh-230px)] h-[calc(100vh-230px)] flex gap-3 bg-gray-100 rounded-md shadow-sm p-3">
        <div class="bg-white flex-1 flex flex-col rounded-md w-full h-full overflow-y-auto overflow-x-hidden">
          <div ref="resultBox" class="p-4 space-y-4 w-full whitespace-pre-line break-words overflow-y-auto">
            <div v-for="(item, index) in aiResult" :key="index"
              class="flex flex-col items-start gap-3">
              
              <div class="flex justify-end w-full" v-if="item.type === 'user'">
                <span class="inline-flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-normal text-slate-600 ring-1 ring-inset ring-gray-500/10 whitespace-pre-line block"> {{ item.content }}</span>
              </div>
              
              <div class="flex-1 min-w-full" v-else>
                <CharTest class="max-w-[1000px] max-h-[300px]"/>
                <p v-if="item.contentType === 'text'" class="text-sm text-slate-600 font-normal">{{ item.content }}</p>
                
                <div v-else-if="item.contentType === 'table'">
                  <n-table :bordered="false" :single-line="false">
                    <thead>
                    <tr>
                      <th v-for="(colName, colindex) in item.col" :key="colindex">{{colName}}</th>
                    </tr>
                  </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>2</td>
                        <td>3</td>
                        <td>...</td>
                        <td>5</td>
                      </tr>
                    </tbody>
                  </n-table>
                </div>

                <div v-else-if="item.contentType === 'createTemplate'">
                  <n-table :bordered="false" :single-line="false">
                    <thead>
                    <tr>
                      <th v-for="(colName, colindex) in item.col" :key="colindex">{{colName}}</th>
                    </tr>
                  </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>2</td>
                        <td>3</td>
                        <td>...</td>
                        <td>5</td>
                      </tr>
                    </tbody>
                  </n-table>
                </div>

                <div v-else-if="item.contentType === 'updateTemplate'">
                  <n-table :bordered="false" :single-line="false">
                    <thead>
                    <tr>
                      <th v-for="(colName, colindex) in item.col" :key="colindex">{{colName}}</th>
                    </tr>
                  </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>2</td>
                        <td>3</td>
                        <td>...</td>
                        <td>5</td>
                      </tr>
                    </tbody>
                  </n-table>
                </div>

              </div>

              <n-divider v-if="item.type === 'system'"/>
            </div>
          </div>
        </div>
      </div>

      <textarea 
        v-model="aiText" 
        rows="4"
        class="mt-3 w-full resize-none rounded-lg bg-gray-100 px-3 py-2 pr-10 text-sm focus:outline-none text-slate-500"
        placeholder="AI에게 물어보세요..." 
        @keydown.enter.exact="submitAI"
        @keydown.shift.enter.stop
        :style="{ 'max-height': textareaMaxHeight + 'px' }"
      ></textarea>
      <!-- 보내기 버튼 (아이콘) -->
      <button @click="submitAI"
        class="absolute bottom-15 right-8 flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded-full hover:bg-blue-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-label="보내기">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

// Ionicons
import { IonIcon } from '@ionic/vue'
import { textOutline, ellipsisHorizontalOutline, removeOutline, listOutline, linkOutline } from 'ionicons/icons'
import CharTest from './chartTest.vue'

const textareaMaxHeight = 100;
const aiText = ref("")
const aiResult = ref([])
const resultBox = ref(null)
const loading = ref(false)

// aiResult가 변경될 때마다 스크롤을 하단으로 이동
watch(aiResult, async () => {
  await nextTick()
  if (resultBox.value) {
    resultBox.value.scrollTop = resultBox.value.scrollHeight
  }
})

/**
 * 
 * 데이터 구조
 * 
 * type > user (질문), system (답변) , ing (처리중) , proc (중간 메시지)
 * content > 질문 내용 또는 답변 내용 
 * contentType > 답변 타입 text : 일반 문자열 답변, table : 목록형 답변 , createTemplate : 등록 UI , updateTemplate : 수정 UI
 * 
 * 
 * 시나리오
 1. ERP 
 1) 법인카드 전표 처리 (일괄 처리 반복 및 빠른 업무 처리)
  1. 이번달 법인카드 내역 알려줘 
   - 이번달 법인카드 목록을 모두 조회하여 table 형식으로 보여준다. 
  2. 위 정보를 내역을 모두 자동으로 입력하고 모두 우리 조직 코스트로 등록하여 전표 처리 할래 
   - 계정과목은 어떻게 할가요?
   - 계정과목은 모두 운영비로 해줘. 
   - 법인 카드 목록의 사용 내역을 ai 가 자동으로 등록하고 , 코스트 센터를 모두 우리 조직, 계정과목은 "운영비" 로 설정 되어 목록에 보여줌..
   - 하단에 전송 버튼이 있으며, 전송시 모두 그룹전표가 생성 되고 , 결재를 자동상신함. (시나리오 최소화 - 시연을 위함.)
 2) 판매 오더
  # 프로세스 
  [판매오더 등록]
     ↓
  [출하 요청 → 출하 완료]
      ↓
  [청구 요청 → 세금계산서 발행]
      ↓
  [수금 등록 → 미수금 정리]
      ↓
  [매출전표 생성 → 회계 처리]

  1. 판매오더 등록 
   * 항목
    - 고객: 현대건설
    - 품목: 냉난방기 3대
    - 단가: 2,900,000원
    - 요청 납기: 2025.06.30
    - 결제조건: 납품 후 30일
    - 담당자: 박민수 과장
  
   1) 질문 : 
    - 고객: 현대건설
    - 품목: 냉난방기 3대
    - 단가: 2,900,000원
    - 요청 납기: 2025.06.30
    - 결제조건: 납품 후 30일
    - 담당자: 박민수 과장
    이 내용으로 판매 오더 만들어줘
   2) 판매오더 생성 템플릿이 답변되며, 위 내용이 자동으로 등록 됨..
      하단에 전송버튼을 클릭하면 오더가 생성 됨.
  
  1. 출하가 안된 판매오더 보여줘
    - 출하가 되지 않은 판매오더 10개를 table 형식으로 보여준다.
  2. 모두 출하 처리 해줘 
    - 판매오더 번호와 송장번호 정보를 입력하여 주시면, 출하처리를 할 수 있습니다. 
    .. 와 같은 답변. (필수 정보 누락에 대한 답변 - AI )
  3. “오늘 출하할 오더는 SO240601, SO240602, SO240603이고,
     각각 송장은 900001 (한진), 900002 (롯데), 900003 (CJ)이야.
     출하처리 부탁해.”

    - 모두 출하처리하여 3개의 오더를 table 형식으로 보여줌 . 
  
3) 현황 조회 
   1.  “올해 월별 매출 추이 그래프로 보여줘”
     	•	📊 차트 유형: 라인(Line) 또는 바(Bar)
      •	📌 X축: 1월 ~ 12월
      •	📌 Y축: 매출 금액
      •	📌 옵션: 전년 동월 비교, 마우스 툴팁로 세부 내역

      * 추세에 대한 설명을 ai가 작성하여, 차트와 함께 답변
    
 */
async function submitAI() {
  
  if (!aiText.value.trim() || loading.value == true) {
    return; // 입력이 비어있으면 아무 작업도 하지 않음
  }

  loading.value = true;

  /** 몽고 디비 테스트 */
  // const res1 = await fetch('/api/testMongo');
  // console.log("mongo", res1)
  // if (!res1.ok) {
  //   throw new Error('서버 응답 오류: ' + res1.status)
  // }
  // const json = await res1.json()

  // console.log("mongo", json)

  try{

    aiResult.value.push({
      type: 'user',
      contentType: 'text',
      content: aiText.value
    })
  
    // aiResult.value.push({
    //   type: 'user',
    //   contentType: 'text',
    //   content: "안녕하세요. AI입니다. 무엇을 도와드릴까요?"
    // })
  
    aiResult.value.push({
      type: 'system',
      contentType: 'text',
      content: "AI 응답을 기다리는 중..."
    })
  
    const res = await fetch('/api/test');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
  
    let chatResult = '';
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(decoder.decode(value));
  
      // aiResult.value += decoder.decode(value);
  
      chatResult += decoder.decode(value);
  
      aiResult.value[aiResult.value.length - 1].content = chatResult;
      aiResult.value[aiResult.value.length - 1] = JSON.parse(JSON.stringify(aiResult.value[aiResult.value.length - 1]));
  
      await nextTick()
      if (resultBox.value) {
        resultBox.value.scrollTop = resultBox.value.scrollHeight
      }
    }
  
    aiText.value = '' // 입력창 초기화
  }catch(e) {
    console.error('AI 요청 중 오류 발생:', e)
  } finally {
    loading.value = false
  }
  
  // aiResult.value = ''
  // const res = await fetch('/api/bedrock-stream', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ prompt: '여기에 프롬프트 입력' }),
  // })

  // if (!res.body) return

  // const reader = res.body.getReader()
  // const decoder = new TextDecoder()

  // while (true) {
  //   const { done, value } = await reader.read()
  //   if (done) break
  //   aiResult.value += decoder.decode(value)
  // }
}
</script>
