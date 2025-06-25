<template>
  <div class="relative">
    <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
      <div class="flex items-center justify-between">
        <div class="flex pb-3 justify-end gap-3 items-center">
          <n-select
            placeholder="처리자 검색 조건.."
            v-model:value="searchUser"
            :clearable="true"
            bordered="false"
            class="n-select-nowrap"
            style="width: 300px"
            value-field="name"
            label-field="name"
            multiple
            :options="users"
          />
          <n-date-picker v-model:value="range" type="daterange" clearable />
        </div>
        <div class="flex pb-3 justify-end gap-3 items-center">
          <n-button strong secondary round type="primary">
            데이터 불러오기
          </n-button>
          <n-button
            strong
            secondary
            round
            type="tertiary"
            @click="registerwork"
          >
            등록
          </n-button>
          <n-button strong secondary round type="info"> 조회 </n-button>
        </div>
      </div>

      <div class="flex gap-4">
        <div
          v-for="column in columns"
          :key="column.value"
          class="flex-1 bg-slate-100/50 text-md p-4 flex flex-col rounded-md h-[calc(100vh-160px)]"
          @dragover.prevent
          @drop="onDrop($event, column.value)"
        >
          <h2 class="font-bold mb-4 text-slate-600">{{ column.name }}</h2>
          <div class="flex-1 space-y-2 overflow-y-auto">
            <div
              v-for="work in works.filter((c) => c.status === column.value)"
              :key="work.id"
              class="p-3 bg-white shadow rounded-md cursor-move text-md flex flex-col gap-2"
              draggable="true"
              @dragstart="onDragStart($event, work.id)"
            >
              <p
                class="line-clamp-2 text-slate-600 break-words text-sm font-normal"
              >
                {{ work.title }}
              </p>

              <div class="flex items-center justify-between pt-3 pb-3">
                <p class="text-sm font-normal text-slate-400">
                  기간: {{ work.startDate }} ~ {{ work.endDate }} {{ work.procName ? work.procName : "" }}
                </p>
                <div class="flex gap-2 items-center">
                  <div
                    class="px-3 h-6 rounded-full text-xs font-semibold flex items-center"
                    :class="getBadgeClasses(work.type).badge"
                  >
                    <!-- <span class="w-2 h-2 rounded-full mr-1" :class="`bg-${getTypeColor(work.type)}-400 flex-shrink-0`"></span> -->
                    <span
                      class="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                      :class="getBadgeClasses(work.type).dot"
                    ></span>
                    <span>
                      {{ work.type }}
                    </span>
                    <n-icon
                      class="ml-2 cursor-pointer"
                      @click="
                        () => {
                          openSelectItem(work);
                        }
                      "
                      ><OpenOutline
                    /></n-icon>                    
                  </div>
                </div>
              </div>
              <n-progress
                type="line"
                indicator-placement="inside"
                :color="resolveColor(work.color)"
                :rail-color="changeColor(resolveColor(work.color), { alpha: 0.2 })"
                :percentage="work.progress"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <n-float-button
      position="fixed"
      bottom="50px"
      right="24px"
      menu-trigger="click"
      v-model:show-menu="showMenu"
      class="z-50 transition overflow-visible"
    >
      <n-icon>
        <text
          x="12"
          y="16"
          text-anchor="middle"
          font-size="12"
          fill="currentColor"
          font-family="Arial, sans-serif"
          >AI</text
        >
      </n-icon>

      <template #menu>
        <!-- 하단 중앙 고정 입력창 (아이콘 버튼 포함) -->
        <div
          class="fixed rounded-lg bottom-0 left-1/2 -translate-x-1/2 w-250 bg-white p-4 shadow-xl flex justify-center"
        >
          <div class="relative w-250">
            <div
              class="flex flex-col h-[400px] bg-slate-100/50 rounded-md text-sm text-slate-600 font-normal p-3"
            >
              <div
                ref="resultBox"
                class="p-4 space-y-4 w-full whitespace-pre-line break-words overflow-y-auto"
              >
                <div
                  v-for="(item, index) in aiResult"
                  :key="index"
                  class="flex flex-col items-start gap-3"
                >
                  <div
                    class="flex justify-end w-full"
                    v-if="item.type === 'user'"
                  >
                    <span
                      class="inline-flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-normal text-slate-600 ring-1 ring-inset ring-gray-500/10 whitespace-pre-line block"
                    >
                      {{ item.content }}
                    </span>
                  </div>    
                  <div class="flex-1" v-else>
                    <div v-if="item.contentType === 'text'">
                      <div v-if="item.type === 'system'">
                        <div v-if="item.answers?.length">
                          <div
                            v-for="(ans, i) in item.answers"
                            :key="i"
                            class="rounded-xl border border-slate-200 bg-gray-50 p-4 mb-3 shadow-sm"
                          >
                            <div class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {{ ans.content }}
                            </div>

                            <div class="mt-3 text-right">
                              <n-button size="small" ghost type="primary" @click="openAnsSelectItem(ans.work.id)">
                                상세보기
                              </n-button>
                            </div>
                          </div>
                        </div>
                        <div v-else>
                          <p class="text-sm text-slate-600 font-normal">
                            {{ item.content }}
                          </p>
                        </div>                        
                      </div>                              
                    </div>

                    <div v-else-if="item.contentType === 'table'">
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

                    <div v-else-if="item.contentType === 'createTemplate'">
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

                    <div v-else-if="item.contentType === 'updateTemplate'">
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

            <textarea
              v-model="aiText"
              rows="2"
              class="mt-3 w-full resize-none rounded-lg bg-gray-100 px-3 py-2 pr-10 text-sm focus:outline-none text-slate-500"
              placeholder="AI에게 물어보세요..."
              @keydown.enter.exact="submitAI"
              @keydown.shift.enter.stop
              @input="autoResize"
              :style="{ 'max-height': textareaMaxHeight + 'px' }"
            ></textarea>

            <!-- 보내기 버튼 (아이콘) -->
            <button
              @click="submitAI"
              class="absolute bottom-6 right-2 flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded-full hover:bg-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                viewBox="0 0 24 24"
                aria-label="보내기"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </n-float-button>
  </div>
  <!-- 등록 / 수정 팝업 모달 -->
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="selectedItem?.type"
    class="w-[800px] max-w-[800px] rounded-md"
  >
    <div
      v-if="!updateMode"
      class="flex flex-col gap-2 p-3 rounded-md bg-slate-100"
    >
      <div class="w-full bg-white p-3 rounded-md">
        {{ selectedItem?.title }}
      </div>
      <div
        class="w-full bg-white p-3 rounded-md h-100"
        v-html="selectedItem?.content"
      ></div>
      <n-descriptions
        label-placement="left"
        class="w-full bg-white p-3 rounded-md"
      >
        <n-descriptions-item>
          <template #label> 생성일자 </template>
          <span class="text-slate-500 flex items-center gap-2">
            {{ selectedItem?.date }}

            <div
              v-if="selectedItem?.procName"
              class="text-green-400 flex-none rounded-full p-1']"
            >
              <div class="size-1.5 rounded-full bg-current" />
            </div>

            <span v-if="selectedItem?.procName">
              {{ selectedItem?.procName }}
            </span>
          </span>
        </n-descriptions-item>
      </n-descriptions>
    </div>

    <n-form
      label-placement="left"
      :label-width="50"
      size="small"
      ref="formRef"
      v-if="updateMode"
      :model="selectedItem"
      class="rounded-md p-3"
    >
      <n-form-item :span="2" label="처리자" path="procName">
        <n-select
          v-model:value="selectedItem.procName"
          :options="users"
          value-field="name"
          label-field="name"
          placeholder="처리자를 선택하세요"
          clearable
        />
      </n-form-item>
      <n-form-item :span="2" label="상태" path="status">
        <n-select
          v-model:value="selectedItem.statusName"
          :options="status"
          placeholder="상태를 선택하세요"
          value-field="name"
          label-field="name"
          clearable
        />
      </n-form-item>
      <n-form-item label="유형" path="type">
        <n-select
          v-model:value="selectedItem.type"
          :options="
            Object.keys(mappings).map((type) => ({ label: type, value: type }))
          "
          placeholder="유형을 선택하세요"
          clearable
        />
      </n-form-item>
      <n-form-item label="제목" path="title">
        <n-input
          v-model:value="selectedItem.title"
          placeholder="제목을 입력하세요"
          clearable
        />
      </n-form-item>
      <n-form-item label="내용" path="content">
        <div class="flex-1 flex flex-col bg-gray-100 shadow-sm p-3 rounded-md">
          <div
            class="sticky top-0 z-10 flex gap-2 bg-white py-2 px-4 border-b border-gray-200"
          >
            <!-- 굵게: textOutline -->
            <n-button
              quaternary
              size="small"
              @click="editor.chain().focus().toggleBold().run()"
            >
              <IonIcon :icon="textOutline" class="text-xl" />
            </n-button>
            <!-- 기울임: ellipsisHorizontalOutline(대체) -->
            <n-button
              quaternary
              size="small"
              @click="editor.chain().focus().toggleItalic().run()"
            >
              <IonIcon :icon="ellipsisHorizontalOutline" class="text-xl" />
            </n-button>
            <!-- 밑줄: removeOutline(대체) -->
            <n-button
              quaternary
              size="small"
              @click="editor.chain().focus().toggleUnderline().run()"
            >
              <IonIcon :icon="removeOutline" class="text-xl" />
            </n-button>
            <!-- 리스트: listOutline -->
            <n-button
              quaternary
              size="small"
              @click="editor.chain().focus().toggleBulletList().run()"
            >
              <IonIcon :icon="listOutline" class="text-xl" />
            </n-button>
            <!-- 링크: linkOutline -->
            <n-button
              quaternary
              size="small"
              @click="
                (() => {
                  const url = prompt('링크 주소를 입력하세요:');
                  if (url) editor.chain().focus().setLink({ href: url }).run();
                })()
              "
            >
              <IonIcon :icon="linkOutline" class="text-xl" />
            </n-button>
          </div>
          <editor-content
            :editor="editor"
            class="h-[calc(100vh-550px)] overflow-y-auto flex max-h-full p-3 rounded bg-white"
          />
        </div>
      </n-form-item>
    </n-form>

    <template #action>
      <div class="flex p-2 gap-3 items-center justify-end">
        <n-button
          strong
          secondary
          v-if="!updateMode"
          @click="updateMode = true"
        >
          편집
        </n-button>
        <n-button
          strong
          secondary
          type="warning"
          v-if="updateMode"
          @click="updateMode = false"
        >
          취소
        </n-button>
        <n-button
          strong
          type="primary"
          secondary
          v-if="updateMode"
          @click="
            () => {
              showModal = false;
            }
          "
        >
          저장
        </n-button>
        <n-button strong secondary type="warning" @click="showModal = false">
          닫기
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { OpenOutline } from "@vicons/ionicons5";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useWorkStore } from '~/stores/work';

const workStore = useWorkStore()
const works = workStore.works

// Ionicons
import { IonIcon } from "@ionic/vue";
import {
  textOutline,
  ellipsisHorizontalOutline,
  removeOutline,
  listOutline,
  linkOutline,
} from "ionicons/icons";
import { useThemeVars } from 'naive-ui';
import { changeColor } from 'seemly';

const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(today.getMonth() - 1);

const range = ref([oneMonthAgo, today]);

const showInput = ref(false);
const aiText = ref("");
const textareaMaxHeight = 200; // 약 3줄 정도 최대 높이(px)
const aiResult = ref([]);
const loading = ref(false);
const showMenu = ref(false);
const showModal = ref(false);
const searchUser = ref("");
const selectedItem = ref(null);
const updateMode = ref(false);
const resultBox = ref(null);
const themeVars = useThemeVars();
const sessionUser = ref({
  id: 1,
  name: "나웅진",
  email: "nawoongjin@woongjin.co.kr",
});

const extensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
  }),
  TextStyle,
  Color,
  ListItem,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Highlight,
  Underline,
  Link,
];

// 각 주간 보고 에디터
const editor = new Editor({
  extensions,
  content: "",
});

const users = ref([
  { id: 1, name: "나웅진" },
  { id: 2, name: "김지민" },
  { id: 3, name: "김수빈" },
  { id: 4, name: "김영희" },
]);

// 컬럼 상태
const columns = ref([
  {value: 1, name: "대기 업무"},
  {value: 2, name: "해야 할 일"},
  {value: 3, name: "진행 중"},
  {value: 4, name: "완료"}
]);

const status = ref([
  { value: 1, name: "대기 업무" },
  { value: 2, name: "해야 할 일" },
  { value: 3, name: "진행 중" },
  { value: 4, name: "완료" },
]);

const mappings = {
  개발: "purple",
  단순문의: "teal",
  업무협의: "blue",
  보고: "green",
  미팅: "teal",
};

function getBadgeClasses(type) {
  const color = mappings[type] || "teal";
  return {
    badge: `bg-${color}-100 text-${color}-700`,
    dot: `bg-${color}-400`,
  };
}

/** 텍스트 자동 높이 조절 */
function autoResize(e) {
  const ta = e.target;
  ta.style.height = "auto";
  ta.style.height = `${Math.min(ta.scrollHeight, textareaMaxHeight)}px`;
}

const openAnsSelectItem = (id) => {
  works.forEach((work) => {
    if (work.id === id) {
      openSelectItem(work);
    }
  });
};

let progressState = 0;
let progressInterval = null;

// 다양한 프로그레스 표현 방식
const progressTypes = {
  spinner: () => {
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return `\n\n${spinners[progressState % spinners.length]} 데이터 분석 중...`;
  },
};
const selectedProgressType = 'spinner';

// 함수 시작 부분에 변수들 선언
let visibleText = '';
let chatResult = '';
let insideJsonBlock = false;

function startProgressAnimation() {
  progressState = 0;
  
  progressInterval = setInterval(() => {
    progressState++;
    const progressText = progressTypes[selectedProgressType]();
    const currentContent = visibleText + progressText;
    aiResult.value[aiResult.value.length - 1].content = currentContent;
  }, 200); // 0.2초마다 업데이트
}

function stopProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
    progressState = 0;
  }
}


/** 제출 처리 */
async function submitAI() {
  if (!aiText.value.trim() || loading.value) return;

  loading.value = true;

  aiResult.value.push({
    type: "user",
    contentType: "text",
    content: aiText.value,
  });

  aiResult.value.push({
    type: "system",
    contentType: "text",
    content: "AI 응답을 기다리는 중...",
  });

  try {

    // 업무 요약 텍스트로 변환 (HTML 제거 포함)
    const worksSummary = works
      .map((work, idx) => {
        const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return `${idx + 1}. [${work.statusName}] ${work.type} - ${work.title} (기간: ${work.startDate} ~ ${work.endDate})\n${textContent} 진행률: ${work.progress}% ) 키: ${work.id}`;
      })
      .join("\n\n");

    const body = {
        system: `
        너는 프로젝트 관리 시스템에 연결된 AI야.
        사용자의 요청에 따라 업무 업무 목록을 분석해서, 질문에 맞는 항목만 골라 아래 형식대로 JSON 형식으로 응답해줘.

        📌 응답 형식:
        "[statusName] type - title 
          - 기간: startDate ~ endDate
          - 진행률: progress%"</br>
        <jsonData>
          {
            "answers": [
              {
                "content": "[statusName] type - title \\n- 기간: startDate ~ endDate\\n- 진행률: progress%",
                "work": { 업무 객체 그대로 }
              },
            ]
          }
        </jsonData>
        
        📌출력순서
        1. 사람이 읽을 수 있는 텍스트 목록을 먼저 출력 (content만 표시)
        2. 그 다음 <jsonData> 태그로 감싸진 JSON 응답을 출력

        📌 필수 출력 규칙:
        - HTML 태그나 버튼 코드는 절대 포함하지 말 것
        - 각 항목마다 content와 work를 쌍으로 배열에 포함할 것
        - work는 사용자가 선택한 항목을 다시 불러오기 위해 전체 업무 객체 그대로 포함할 것
        - content는 사람이 읽기 쉬운 텍스트만 포함할 것
        - 답변의 순서는 종료일이 가장 빠른 업무가 가장 먼저 나오도록 정렬할 것

        📌 날짜 조건 처리 방식:
        - 오늘 날짜는 반드시 "2025-06-24"로 간주할 것
        - 사용자가 "마감일이 10일 이내" 같은 요청을 하면, endDate 기준으로 오늘과의 차이를 계산해 조건에 맞는 업무만 포함할 것
        - 사용자가 "시작 날짜가 6월 1일 이후인 업무"라고 하면, startDate가 "2025-06-01"보다 **이후인 업무만** 포함할 것
        - 날짜 형식은 모두 "YYYY-MM-DD"로 되어 있음
        - JavaScript의 new Date("YYYY-MM-DD")를 사용해 날짜 차이를 계산한다고 가정하고 비교할 것

        📌 진행률 관련 처리:
        - 사용자가 진행률을 기준으로 질문할 경우, 조건에 맞지 않는 진행률(예: 100%)인 항목은 제외할 것
        - 단, 진행률 조건이 없는 질문에는 모두 포함 가능

        📌 JSON 작성 시 주의사항:
        - 모든 문자열은 JSON 규격에 맞게 이스케이프 처리할 것 (예: 큰따옴표, 백틱 등)
        - description, title 등 문자열 안에 백틱 또는 큰따옴표(")가 있다면 반드시 \\ 또는 제거할 것
        - answer는 사람이 읽을 수 있도록 포맷만 적용한 plain string이어야 함

        📌 예시 응답:
        "[진행중] 기능개발 - 로그인 시스템 
         - 기간: 2025-01-01 ~ 2025-01-15
         - 진행률: 75%" </br>
        <jsonData>
          {
            "answers": [
              {
                "content": "[진행중] 기능개발 - 로그인 시스템 \\n- 기간: 2025-01-01 ~ 2025-01-15\\n- 진행률: 75%",
                "work": {
                  "id": 1,
                  "type": "개발"
                }
              }
            ]
          }
        </jsonData>
        `,        
        history: [],
        user: aiText.value,
        works: works.value
    };

    const prompt = [
      {
        role: "user",
        content: `${body.system}\n\n업무 목록:\n${worksSummary}\n\n사용자 질문:\n${body.user}`
      }
    ];      

    const res = await fetch("/api/bedrock-common", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt)
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    chatResult = "";
    visibleText = "";
    insideJsonBlock = false;

    while (true) { 
      const { done, value } = await reader.read(); 
      if (done) break; 

      const chunk = decoder.decode(value); 
      chatResult += chunk; 

      if (!insideJsonBlock) { 
        const jsonStartIndex = chatResult.indexOf("<jsonData>"); 
        if (jsonStartIndex !== -1) { 
          visibleText = chatResult.substring(0, jsonStartIndex); 
          insideJsonBlock = true; 
          startProgressAnimation(); // 프로그레스 시작
        } else { 
          visibleText = chatResult; 
          aiResult.value[aiResult.value.length - 1].content = visibleText;
        } 
      } else {
        const jsonEndIndex = chatResult.indexOf("</jsonData>"); 
        if (jsonEndIndex !== -1) {
          insideJsonBlock = false;
          stopProgressAnimation(); // 프로그레스 중지
          aiResult.value[aiResult.value.length - 1].content = visibleText;
        }
      }

      await nextTick(); 
      if (resultBox.value) 
        resultBox.value.scrollTop = resultBox.value.scrollHeight; 
    }

    stopProgressAnimation();

    const jsonMatch = chatResult.match(/<jsonData>\s*([\s\S]*?)\s*<\/jsonData>/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        aiResult.value[aiResult.value.length - 1].answers = parsed.answers; 
      } catch (e) {
        aiResult.value[aiResult.value.length - 1].answers = "데이터를 찾지 못했습니다.";
      }
    } else {
      aiResult.value[aiResult.value.length - 1].answers = "데이터를 찾지 못했습니다.";
    }    

    aiText.value = "";
  } catch (e) {
    console.error("AI 요청 중 오류 발생:", e);
  } finally {
    loading.value = false;
  }
}

// 입력값 예시
const newwork = {
  id: null,
  type: "",
  title: "",
  statusName: "",
  startDate: "",
  content: "",
};

function registerwork() {
  // 간단한 유효성 검사 및 id 생성
  let createItem = JSON.parse(JSON.stringify(newwork));
  createItem.id = works.value.length + 1;
  createItem.date = new Date().toISOString().split("T")[0]; // 현재 날짜
  createItem.status = "대기 업무"; // 기본 상태 설정
  createItem.content = ".."; // 기본 상태 설정
  createItem.procName = sessionUser.value.name; // 현재 사용자 이름으로 처리자 설정
  works.value.push(createItem);

  showModal.value = true;
  selectedItem.value = works.value[works.value.length - 1];
  updateMode.value = true; // 새로 등록할 때는 수정 모드로 전환
  editor.commands.setContent(works.value[works.value.length - 1].content || "");
};

function resolveColor(colorKey) {
  const color = themeVars.value?.[colorKey]
  return typeof color === 'string' ? color : '#cccccc'
}

const openSelectItem = (work) => {
  showModal.value = true;
  selectedItem.value = work;
  updateMode.value = false;
  updateMode.value = false;
  editor.commands.setContent(work.content || "");
  // 여기에 선택된 업무에 대한 추가 로직을 작성할 수 있습니다.
};

const getTypeColor = (_type) => {
  return mappings[_type];
};

let draggedId = null;

function onDragStart(e, id) {
  draggedId = id;
  e.dataTransfer.effectAllowed = "move";
}

function onDrop(e, toStatus) {
  const work = works.value.find((c) => c.id === draggedId);
  if (work) work.status = toStatus;
  draggedId = null;
}

// aiResult가 변경될 때마다 스크롤을 하단으로 이동
watch(aiResult, async () => {
  await nextTick()
  if (resultBox.value) {
    resultBox.value.scrollTop = resultBox.value.scrollHeight
  }
})

</script>

<style>
.n-work__action {
  padding: 0 !important;
}
/* Tailwind 기반 스타일 외 필요 시 여기에 추가 */

/* 포커스 스타일 제거 */
.ProseMirror:focus {
  outline: none;
}
</style>

