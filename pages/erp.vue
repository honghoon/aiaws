<template>
  <div class="relative">
    <div
      class="min-h-[calc(100vh-75px)] max-h-[calc(100vh-75px)] bg-white flex flex-col p-6 w-full overflow-x-hidden overflow-y-hidden"
    >
      <div
        class="min-h-[calc(100vh-250px)] h-[calc(100vh-250px)] flex gap-3 bg-gray-100 rounded-md shadow-sm p-3 w-full overflow-x-hidden"
      >
        <div
          class="bg-white flex-1 flex flex-col rounded-md w-full h-full overflow-y-auto overflow-x-hidden"
        >
          <div
            ref="resultBox"
            class="p-4 space-y-4 w-full whitespace-pre-line break-words overflow-y-auto overflow-x-hidden"
          >
            <div
              v-for="(item, index) in aiResult"
              :key="index"
              class="flex flex-col items-start gap-3"
            >
              <div class="flex justify-end w-full" v-if="item.type === 'user'">
                <span
                  class="items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-normal text-slate-600 ring-1 ring-inset ring-gray-500/10 whitespace-pre-line block"
                >
                  {{ item.content }}</span
                >
              </div>

              <div
                class="flex-1 min-w-full max-w-full overflow-x-hidden"
                v-else
              >
                <!-- <CharTest class="max-w-[1000px] max-h-[300px]"/> -->
                <div
                  v-if="item.contentType != 'proc'"
                  class="text-base text-slate-600 font-normal lex flex-col gap-0 mb-3"
                  v-html="renderedHtml(item.content)"
                ></div>
                <!-- <p v-if="item.contentType != 'proc'" class="text-sm text-slate-600 font-normal">{{ item.content }}</p> -->
                  <p
                    v-if="item.contentType === 'proc'"
                    class="text-sm text-slate-600 font-normal relative overflow-hidden shimmer-bg px-2 py-1 rounded-md"
                  >
                    {{ item.content }}
                  </p>
                  <n-space vertical v-if="item.contentType === 'proc' || item.contentType === 'text'">
                    <n-skeleton text :repeat="1" width="40%"/> 
                    <n-skeleton text :repeat="1" width="80%" height="80px" /> 
                    <n-skeleton text :repeat="1" width="60%"/> 
                    <n-skeleton height="40px" width="66%" circle />
                  </n-space>

                <div
                  v-if="item.contentType === 'table'"
                  class="flex w-full"
                  style="max-width: 100%"
                >
                  <ComTable
                    :columns="item.col"
                    :tableRowData="item.tableRowData"
                    :tableTitle="item.title"
                  />
                </div>

                <div
                  v-if="item.contentType === 'table_edit'"
                  class="flex w-full"
                  style="max-width: 100%"
                >
                  <ComTable
                    :columns="item.col"
                    :tableRowData="item.tableRowData"
                    :tableTitle="item.title"
                    edit="edit"
                  />
                </div>

                <div
                  v-if="item.contentType === 'form'"
                  class="flex w-full"
                  style="max-width: 100%"
                >
                  <dynamicForm
                    :schema="item.schema"
                    :modelValue="item.modelValue"
                    :title="item.title"
                  />
                </div>

                <div
                  v-if="item.contentType === 'chart'"
                  class="flex w-full"
                  style="max-width: 100%"
                >
                  <ComChart :data="item.data" />
                </div>

                <div v-if="item.contentType === 'createTemplate'">
                  <n-table :bordered="false" :single-line="false">
                    <thead>
                      <tr>
                        <th
                          v-for="(colName, colindex) in item.col"
                          :key="colindex"
                        >
                          {{ colName }}
                        </th>
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

                <div v-if="item.contentType === 'updateTemplate'">
                  <n-table :bordered="false" :single-line="false">
                    <thead>
                      <tr>
                        <th
                          v-for="(colName, colindex) in item.col"
                          :key="colindex"
                        >
                          {{ colName }}
                        </th>
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

              <n-divider v-if="item.type === 'system'" />
            </div>
          </div>
        </div>
      </div>
      
      <textarea
        v-model="aiText"
        rows="4"
        class="shadow-md mt-3 w-full resize-none rounded-lg focus:ring-2 focus:ring-blue-400 transition duration-200 ease-in-out placeholder-slate-400 bg-gray-100 px-3 py-2 pr-10 pl-15 text-sm focus:outline-none text-slate-500"
        placeholder="AI에게 물어보세요..."
        @keydown.enter.exact="send_chat"
        @keydown.shift.enter.stop
        :style="{ 'max-height': textareaMaxHeight + 'px' }"
      ></textarea>
      
      <n-button @click="active = true" strong secondary circle type="info" class="absolute !bottom-15 left-3">
        <template #icon>
          <n-icon><Apps /></n-icon>
        </template>
      </n-button>

      <!-- 보내기 버튼 (아이콘) -->
      <n-button @click="send_chat" strong secondary type="success" circle class="!absolute !bottom-20 right-8">
        <template #icon>
          <n-icon :size="26"><ArrowUpCircle /></n-icon> <!-- 기본보다 큼 -->
        </template>
      </n-button>

    </div>
  </div>
  
  <n-drawer v-model:show="active" :width="350" placement="left">
    <n-drawer-content>
      <n-menu
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options.value="transformedMenuOptions"
          default-expanded-keys="ERP"
          @update:value="handleMenuClick"
      />
    </n-drawer-content>
  </n-drawer>

</template>

<script setup>
import { h, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

// Ionicons
import { NIcon } from 'naive-ui';
import { Apps,  ArrowUpCircle } from "@vicons/ionicons5";
import CharTest from "./chartTest.vue";
import { NTag } from "naive-ui";
import { createColumns } from "~/utils/tableUtils";
import ComTable from "~/utils/comTable.vue";
import ComChart from "~/utils/comChart.vue";
import dynamicForm from "~/utils/dynamicForm.vue";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import mila from "markdown-it-link-attributes";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";

const active  = ref(false)

const md = new MarkdownIt({
  html: true, // HTML 태그 허용
  linkify: true, // www.naver.com → 자동 링크 변환
  typographer: true, // 스마트 따옴표, 대시, 기호 자동 변환
  breaks: true, // 줄바꿈(\n) → <br>
});

const handleMenuClick = (key) => {
  aiText.value = key
  active.value = false
  send_chat()
};
const transformedMenuOptions = ref([]);

const menuOptions = [
  {
      label: 'ERP',
      key: 'ERP',
      icon: 'NewspaperOutline',
      children: [
      {
        label: '법인카드 사용현황',
        key: ''
      },
      {
        label: '법인카드 전표 처리',
        key: ''
      },
      {
        label: '판매현황',
        key: '6월 판매현황을 상세히 보여줘'
      },
      {
        label: '제품별 판매현황',
        key: '6월 제품별 판매현황을 분석해줘 TOP10'
      },
      {
        label: '고객별 판매현황',
        key: '6월 고객별 판매현황을 분석해줘'
      },
      {
        label: '판매오더 상세 확인',
        key: 'SO20250630-0010 판매정보를 상세히 알려줘'
      },
    ]
  },
  {
      label: 'WRMS',
      key: 'about6',
      icon: 'NewspaperOutline'
  },
  {
      label: 'WDMS',
      key: 'about5',
      icon: 'NewspaperOutline'
  },
  {
      label: 'PMS',
      key: 'about4',
      icon: 'NewspaperOutline'
  },
  {
      label: 'BI',
      key: 'about3',
      icon: 'NewspaperOutline',
      to: '/erp'
  },
  {
      label: '그룹웨어',
      key: 'about2',
      icon: 'NewspaperOutline'
  },
];

async function loadIcon(iconName) {
  try {
      const iconModule = await import('@vicons/ionicons5'); // ✅ 필요할 때만 동적 import
      return iconModule[iconName] || null; // ✅ 아이콘이 없으면 null 반환
  } catch (error) {
      console.error(`아이콘 "${iconName}"을 찾을 수 없습니다.`);
      return null;
  }
}

async function renderIcon(iconName) {
  const iconComponent = await loadIcon(iconName);
  if (!iconComponent) return null;
  return () => h(NIcon, null, { default: () => h(iconComponent) });
}

const transMenuoption = async () => {
  // transformedMenuOptions.value = menuOptions;
  for (const item of menuOptions) {
      const transformedItem = { 
          ...item,
          icon: item.icon ? await renderIcon(item.icon) : undefined,
      };

      if (item && item.children) {
          transformedItem.children = [];
          for (const child of item.children) {
              transformedItem.children.push({
                  ...child,
                  icon: child.icon ? await renderIcon(child.icon) : undefined
              });
          }
      }

      transformedMenuOptions.value.push(transformedItem); // ✅ 하나씩 푸시하여 Proxy 문제 방지
  }
  
  console.log("transformedMenuOptions", transformedMenuOptions.value);
};
const textareaMaxHeight = 100;
const aiText = ref("");
const aiResult = ref([]);
const resultBox = ref(null);
const loading = ref(false);
const pagination = {
  pageSize: 5,
};

// aiResult가 변경될 때마다 스크롤을 하단으로 이동
watch(aiResult, async () => {
  await nextTick();
  if (resultBox.value) {
    resultBox.value.scrollTop = resultBox.value.scrollHeight;
  }
});

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
  const res1 = await fetch("/api/testMongo");
  console.log("mongo", res1);
  if (!res1.ok) {
    throw new Error("서버 응답 오류: " + res1.status);
  }
  const json = await res1.json();

  console.log("mongo", json);

  try {
    aiResult.value.push({
      type: "user",
      contentType: "text",
      content: aiText.value,
    });

    // aiResult.value.push({
    //   type: 'user',
    //   contentType: 'text',
    //   content: "안녕하세요. AI입니다. 무엇을 도와드릴까요?"
    // })

    aiResult.value.push({
      type: "system",
      contentType: "text",
      content: "AI 응답을 기다리는 중...",
    });

    const res = await fetch("/api/test");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let chatResult = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(decoder.decode(value));

      // aiResult.value += decoder.decode(value);

      chatResult += decoder.decode(value);

      aiResult.value[aiResult.value.length - 1].content = chatResult;
      aiResult.value[aiResult.value.length - 1] = JSON.parse(
        JSON.stringify(aiResult.value[aiResult.value.length - 1])
      );

      await nextTick();
      if (resultBox.value) {
        resultBox.value.scrollTop = resultBox.value.scrollHeight;
      }
    }

    aiText.value = ""; // 입력창 초기화
  } catch (e) {
    console.error("AI 요청 중 오류 발생:", e);
  } finally {
    loading.value = false;
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

  const user = "교환은 어떻게 하나요?";
  const history = [
    { q: "반품이 가능한가요?", a: "네, 상품 수령 후 7일 이내 가능합니다." },
  ];

  // Claude 메시지 포맷 생성
  const messages = history.flatMap((h) => [
    { role: "user", content: h.q },
    { role: "assistant", content: h.a },
  ]);

  // 마지막 질문 추가
  messages.push({ role: "user", content: user });

  // Claude 호출
  let res = await useBedrock({ messages });
}

const useBedrock = async ({ messages }) => {
  const res = await fetch("/api/bedrock-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  return res;
};

const send_chat = async () => {
  if (!aiText.value.trim() || loading.value == true) {
    return; // 입력이 비어있으면 아무 작업도 하지 않음
  }

  loading.value = true;

  aiResult.value.push({
    type: "user",
    contentType: "text",
    content: aiText.value,
  });

  aiText.value = "";

  aiResult.value.push({
    type: "system",
    contentType: "text",
    content: "AI 응답을 기다리는 중...",
    proc: true,
  });

  let chatResult = "";
  let fullchatResult = "";
  let prompt = [];
  let is_end = false;

  for (let item of aiResult.value) {
    if (item.proc == undefined) {
      if (item.type === "user") {
        prompt.push({ role: "user", content: item.content });
      }
      if (item.type === "system") {
        prompt.push({ role: "assistant", content: item.content });
      }
    }
  }

  const res = await fetch("/api/erp/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt }),
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    loading.value = false;
    return;
  }

  const messgageKey = "--message--";
  const prockey = "--proc--";
  const jsonKey = "--json--";
  let chatType = "text";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      if (chunk == "data: \n\n") {continue;}
      if (chunk == "\n\n") {continue;}
      console.log("chunk", chunk);

      let text = chunk.replace("data: ", "");

      if (text.includes("[DONE]")) return;

      if (text.includes(prockey)) {
        chatType = "proc";
        chatResult = ""; // 챗 초기화
        continue;
      }

      if (text.includes(messgageKey)) {
        chatType = "text";
        chatResult = ""; // 챗 초기화
        continue;
      }

      if (text.includes(jsonKey)) {
        is_end = true;
        fullchatResult += text;
        continue;
      }

      // 빈 줄은 무시
      if (is_end == true) {
        fullchatResult += text;
        continue;
      }

      chatResult += text;
      fullchatResult += text;

      aiResult.value[aiResult.value.length - 1].contentType = chatType;
      aiResult.value[aiResult.value.length - 1].content = chatResult;
      aiResult.value[aiResult.value.length - 1] = JSON.parse(
        JSON.stringify(aiResult.value[aiResult.value.length - 1])
      );

      await nextTick();
      if (resultBox.value) {
        resultBox.value.scrollTop = resultBox.value.scrollHeight;
      }
    }

    console.log("종료 ===")
  } finally {
    if (is_end == true) {
      const parts = fullchatResult.split(jsonKey);
      const afterJson = parts.length > 1 ? parts[1].trim() : "";
      console.log(aiResult.value[aiResult.value.length - 1].content);
      if (afterJson !== "") {
        let tableRowData = JSON.parse(afterJson);

        if (tableRowData.type == "table" || tableRowData.type == "table_edit") {
          aiResult.value[aiResult.value.length - 1].contentType =
            tableRowData.type;
          aiResult.value[aiResult.value.length - 1].col = tableRowData.columns;
          aiResult.value[aiResult.value.length - 1].title = tableRowData.title;
          aiResult.value[aiResult.value.length - 1].tableRowData =
            tableRowData.data;
        }

        if (tableRowData.type == "form") {
          aiResult.value[aiResult.value.length - 1].contentType =
            tableRowData.type;
          aiResult.value[aiResult.value.length - 1].title = tableRowData.title;
          aiResult.value[aiResult.value.length - 1].schema =
            tableRowData.schema;
          aiResult.value[aiResult.value.length - 1].modelValue =
            tableRowData.modelValue;
        }

        if (tableRowData.type == "chart") {
          aiResult.value[aiResult.value.length - 1].contentType =
            tableRowData.type;
          aiResult.value[aiResult.value.length - 1].data = tableRowData;
        }

        aiResult.value[aiResult.value.length - 1] = JSON.parse(
          JSON.stringify(aiResult.value[aiResult.value.length - 1])
        );
        await nextTick();
        if (resultBox.value) {
          resultBox.value.scrollTop = resultBox.value.scrollHeight;
        }
      }
    }
    loading.value = false;
  }
  aiText.value = "";
};

/** table 이 있는 경우 스타일 추가 하기  */
const styledContent = (content) => {
  // 테이블 요소를 포함하고 있는지 검사

  let rehtml = renderedHtml(content);
  const containsTable = /<table[^>]*>/.test(rehtml);
  if (containsTable) {
    // 테이블 요소에 스타일 클래스를 추가합니다.
    const wrapper = document.createElement("div");
    wrapper.innerHTML = rehtml;
    wrapper.querySelectorAll("table").forEach((table) => {
      table.classList.add("table-style");
    });
    return wrapper.innerHTML;
  }
  return rehtml;
};

const renderedHtml = (html) => {
  // Markdown-it 인스턴스 생성
  const md = new MarkdownIt({
    breaks: false, 
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${
            hljs.highlight(str, { language: lang }).value
          }</code></pre>`;
        } catch (error) {
          console.error;
        }
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`; // 기본 처리
    },
  });

  md.use(mila, {
    pattern: /^https?:\/\//, // http(s)로 시작하는 외부 링크에만 적용
    attrs: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  });

  // LLM 응답을 Markdown에서 HTML로 변환, .markdown-body로 감싸기
  return `<div class="markdown-body">${md.render(html)}</div>`;
};

onMounted(async () => {
  await transMenuoption();
});
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -150% 0;
  }
  100% {
    background-position: 150% 0;
  }
}

.shimmer-bg {
  background: linear-gradient(
    90deg,
    rgba(226, 232, 240, 0.08) 0%,
    rgba(255, 255, 255, 0.6) 40%,
    rgba(226, 232, 240, 0.2) 100%
  );
  background-size: 300% 100%;
  animation: shimmer 2s infinite linear;
}

.markdown-body h1 {
  font-size: 1.5rem;
}
.markdown-body h2 {
  font-size: 1.25rem;
}
</style>

<style >

.markdown-body {
  white-space: normal; /* 기본: 줄바꿈 무시 */
  word-break: break-word; /* 긴 단어 줄바꿈 */
}

</style>
