<template>
  <div class="relative">
    <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
      <div class="flex items-center justify-between">
        <div class="flex pb-3 justify-end gap-3 items-center">
          <n-input
            v-model:value="searchUser"
            placeholder="처리자 검색 (이름 입력)"
            @keydown.enter.exact="searchWorks"
            clearable
            style="width: 300px"
          />
          <n-date-picker v-model:value="range" type="daterange" clearable />
        </div>
        <div class="flex pb-3 justify-end gap-3 items-center">
          <n-button strong secondary round type="primary" @click="showFileUploadModal = true">메일 불러오기</n-button>
          <FileUploadModal
            :show="showFileUploadModal"
            @close="showFileUploadModal = false"
            :allWorks="allWorks"
            :works="works"
            @fileUploaded="handleFileUploaded"
          />
          <n-button strong secondary round type="primary" @click="helpRegWork" :loading="helpLoading">HELP(ITSM)</n-button>
          <n-button strong secondary round type="tertiary" @click="registerwork">등록</n-button>
          <n-button strong secondary round type="info"  @click="searchWorks"> 조회 </n-button>
        </div>
      </div>

      <div class="flex flex-row gap-4">
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

              <div class="flex items-center justify-between">
                <div class="flex -space-x-2">
                  <n-avatar
                    v-for="(name, index) in (typeof work.users === 'string' ? work.users.split(',').map(n => n.trim()) : work.users)"
                    :key="index"
                    round
                    size="tiny"
                    :src="userAvatarMap[name] || 'https://via.placeholder.com/40'"
                    :title="name"
                    :style="{ zIndex: 10 - index }"
                  />
                </div>
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

              <div class="flex items-center justify-between">
                <p class="text-sm font-normal text-slate-400">
                  기간: {{ formatDate(work.startDate) }} ~ {{ formatDate(work.endDate) }} {{ work.procName ? work.procName : "" }}
                </p>
                <div class="flex gap-2 items-center" v-if="work.status != 4">
                  <!-- 알림 아이콘: 댓글이 있을 때만 표시 -->
                  <template v-if="work.comments && work.comments.length > 0">
                    <n-icon
                      class="inline-flex items-center justify-center text-red-400 bg-red-100 w-6 h-6 text-base rounded-full"
                    >
                      <NotificationsOutline />
                    </n-icon>
                  </template>
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
          class="fixed rounded-lg bottom-0 left-100 -translate-x-1/2 w-150 bg-white p-4 shadow-xl flex justify-center" style="transform: translateX(-5%)"
        >
          <div class="relative w-150">
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
                          </div>
                        </div>
                        <div v-else>
                          <p class="text-sm text-slate-600 font-normal">
                            {{ item.content }}
                          </p>
                        </div>                                            
                      </div>                                            
                    </div>
                  </div>
                </div>
                <n-space vertical v-if="is_end">
                  <n-skeleton text :repeat="1" width="40%"/> 
                  <n-skeleton text :repeat="1" width="80%" height="80px" /> 
                  <n-skeleton text :repeat="1" width="60%"/> 
                  <n-skeleton height="40px" width="66%" circle />
                </n-space>
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
            <n-button
              @click="submitAI"
              strong
              secondary
              type="success"
              :loading="loading"
              circle
              class="!absolute !bottom-[17px] right-3"
            >
              <template #icon>
                <n-icon :size="26">
                  <ArrowUpCircle />
                </n-icon>
              </template>
            </n-button>
          </div>
        </div>
        <div
          class="fixed rounded-lg bottom-0 left-2/2 -translate-x-2/2 w-100 bg-white p-4 shadow-xl flex flex-col justify-start h-[calc(100vh-100px)]"
          style="transform: translateX(-20%)"
        >
          <!-- 상단 버튼 탭 (Naive UI n-button 사용) -->
          <div class="flex justify-center space-x-6 mb-10 px-4">
            <n-button
              size="small"
              ghost
              type="primary"
              @click="summaryCallAI(1)"
              style="margin-right: 10px;"
            >
              오늘
            </n-button>
            <n-button
              size="small"
              ghost
              type="primary"
              @click="summaryCallAI(2)"
              style="margin-right: 10px;"
            >
              금주
            </n-button>
            <n-button
              size="small"
              ghost
              type="primary"
              @click="summaryCallAI(3)"
              style="margin-right: 10px;"
            >
              조직
            </n-button>
          </div>

          <!-- 본문 영역 (기존 내용 유지) -->
          <div class="relative w-full flex-1">
            <div
              class="flex flex-col h-[calc(100vh-200px)] bg-slate-100/50 rounded-md text-sm text-slate-600 font-normal p-3"
            >
              <div
                ref="resultBox2"
                class="p-4 space-y-4 w-full whitespace-pre-line break-words overflow-y-auto"
              >
                <div
                  v-for="(item, index) in filteredAiResult"
                  :key="index"
                  class="flex flex-col items-start gap-3"
                >
                  <div class="flex-1">
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
                          </div>
                        </div>
                        <div v-else>
                          <p class="text-sm text-slate-600 font-normal">
                            {{ item.content }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <n-space vertical v-if="is_summary_end">
                  <n-skeleton text :repeat="1" width="40%"/> 
                  <n-skeleton text :repeat="1" width="80%" height="80px" /> 
                  <n-skeleton text :repeat="1" width="60%"/> 
                  <n-skeleton height="40px" width="66%" circle />
                </n-space>                
              </div>
            </div>
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
        <n-input
          v-model:value="selectedItem.users"
          placeholder="처리자(이름 입력)"
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

    <!-- 댓글 입력 및 목록 -->
    <div class="mt-4">
      <div class="flex gap-2 items-start bg-white border border-slate-200 rounded-md p-3 ">
        <n-avatar
          round
          size="small"
          src="https://randomuser.me/api/portraits/men/32.jpg"
        />
        <div class="flex-1 space-y-2">
          <n-input
            v-model:value="selectedItem.newComment"
            type="textarea"
            size="small"
            placeholder="댓글을 입력하세요"
            autosize="{ minRows: 2, maxRows: 4 }"
            class="w-full"
            @keydown.enter.exact.prevent="addComment(selectedItem)"
          />
          <div class="flex justify-between items-center">
            <n-button
              size="tiny"
              dashed
              class="!text-slate-500"
              icon-placement="left"
            >
              <template #icon>
                <n-icon><CloudUploadOutline /></n-icon>
              </template>
              파일 첨부
            </n-button>
            <n-button size="small" type="primary" @click="addComment(selectedItem)">등록</n-button>
          </div>
        </div>
      </div>
      <div class="mt-4 space-y-3" v-if="selectedItem.comments && selectedItem.comments.length">
        <div
          v-for="(comment, cIdx) in selectedItem.comments"
          :key="cIdx"
          class="flex gap-3 items-start bg-slate-50 border border-slate-200 p-3 rounded-md"
        >
          <n-avatar
              round
              size="small"
              :src="userAvatarMap[comment.registrant]"
            />
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <p class="font-semibold text-slate-700">{{ comment.author }}</p>
              <span class="text-xs text-slate-400">{{ comment.date }}</span>
            </div>
            <p class="text-sm text-slate-600 mt-1 whitespace-pre-line">
              {{ comment.content }}
            </p>
            <!-- 대댓글 입력 -->
            <div class="mt-2 ml-10">
              <div class="flex gap-2 items-start bg-white p-3 rounded-md">
                <n-avatar
                  round
                  size="small"
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                />
                <n-input
                  v-model:value="comment.newReply"
                  type="textarea"
                  size="tiny"
                  placeholder="답글을 입력하세요"
                  :autosize="{ minRows: 1, maxRows: 3 }"
                  class="flex-1"
                  @keydown.enter.exact.prevent="addReply(comment)"
                />
                <div class="flex flex-col gap-1">
                  <n-button
                    size="tiny"
                    secondary
                    type="default"
                    class="!border-slate-300"
                  >
                    📎 첨부
                  </n-button>
                  <n-button size="tiny" type="primary" @click="addReply(comment)">등록</n-button>
                </div>
              </div>

              <!-- 대댓글 리스트 -->
              <div class="mt-2 space-y-2" v-if="comment.replies && comment.replies.length">
                <div
                  v-for="(reply, rIdx) in comment.replies"
                  :key="rIdx"
                  class="flex gap-2 items-start text-sm text-slate-600"
                >
                  <n-avatar
                    round
                    size="tiny"
                    :src="userAvatarMap[reply.registrant]"
                  />
                  <div class="bg-slate-100 px-3 py-1 rounded-md flex-1">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold text-slate-700">{{ reply.author }}</span>
                      <span class="text-xs text-slate-400">{{ reply.date }}</span>
                    </div>
                    <p class="text-sm whitespace-pre-line">{{ reply.content }}</p>
                  </div>
                </div>
              </div>
            </div>
            <!-- // 대댓글 입력 및 리스트 -->
          </div>
        </div>
      </div>
    </div>


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
          @click="regWork"          
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
import { kanbanScenarios, todayWorkScnarios, weekWorkScnarios, deptWorkScnarios, helpRegScnarios } from '~/utils/prompts/dashBoard_scenarios.js';

import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Apps, OpenOutline,  ArrowUpCircle ,NotificationsOutline } from "@vicons/ionicons5";
import { CloudUploadOutline } from '@vicons/ionicons5'
import { Editor, EditorContent } from "@tiptap/vue-3";

import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import FileUploadModal from './fileUpload/fileUploadModal.vue';
import Link from "@tiptap/extension-link";

import { useWorkStore } from '~/stores/work';
const workStore = useWorkStore()
const works = workStore.works
const allWorks = ref([...works]); // 원본 복사

import { useHelpWorkStore } from '~/stores/helpWork';
const helpWorkStore = useHelpWorkStore()
const helpWorks = helpWorkStore.helpWorks

const userAvatarMap = {
  "나웅진": "https://randomuser.me/api/portraits/men/32.jpg",
  "김지민": "https://randomuser.me/api/portraits/men/45.jpg",
  "김수빈": "https://randomuser.me/api/portraits/men/64.jpg",
  "김영희": "https://randomuser.me/api/portraits/men/78.jpg"
}

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

const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(today.getMonth() - 3);

const threeMonthsLater = new Date();
threeMonthsLater.setMonth(today.getMonth() + 3);

const range = ref([threeMonthsAgo, threeMonthsLater]);

const showInput = ref(false);
const aiText = ref("");
const textareaMaxHeight = 200; // 약 3줄 정도 최대 높이(px)
const aiResult = ref([]);
const filteredAiResult = ref([]);
const loading = ref(false);
const helpLoading = ref(false);
const showMenu = ref(false);
const showModal = ref(false);
const searchUser = ref("");
const selectedItem = ref(null);
const updateMode = ref(false);
const resultBox = ref(null);
const resultBox2 = ref(null);
const themeVars = useThemeVars();
const createItem = ref({})

const sessionUser = ref({
  id: 1,
  name: "나웅진",
  email: "nawoongjin@woongjin.co.kr",
});

const showFileUploadModal = ref(false);
const handleFileUploaded = function(file) {
  console.log('부모 컴포넌트에서 받은 파일:', file)
  // 추가 처리 로직 작성 가능
}

const todayFormat = new Date().toISOString().split('T')[0].replace(/-/g, '');; // "2025-06-26"

const extensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
  }),
  TextStyle,
  Color,
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
  { userId: 1, name: "나웅진" },
  { userId: 2, name: "김지민" },
  { userId: 3, name: "김수빈" },
  { userId: 4, name: "김영희" },
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

const getBadgeClasses = function(type) {
  const color = mappings[type] || "teal";
  return {
    badge: `bg-${color}-100 text-${color}-700`,
    dot: `bg-${color}-400`,
  };
}

/** 텍스트 자동 높이 조절 */
const autoResize = function(e) {
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

// 함수 시작 부분에 변수들 선언
const isProgressing = ref(false);
const is_end =  ref(false);
const is_summary_end =  ref(false);
const progressText = ref(''); // 계속 갱신될 텍스트 (⠋ 분석 중...)

const startProgressAnimation = (contentEle) => {  
  isProgressing.value = true;
  progressState = 0;

  progressInterval = setInterval(() => {
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    progressText.value = `업무를 조회 중 입니다... ${spinners[progressState % spinners.length]}`;
    contentEle.value[contentEle.value.length-1].content = progressText.value;
    
    
    progressState++;
  }, 200);
};

const searchWorks = function () { 
  works.splice(0, works.length, ...allWorks.value); //원본데이터를 다시 넣는 형태
  const hasUser = searchUser.value?.trim(); // 사용자가 입력된 경우
  const hasRange = range && range.length === 2 && range[0] && range[1]; // 날짜 범위 유효한 경우

  const filtered = allWorks.value.filter((work) => {
    const userMatched = hasUser ? work.users.join(",").includes(hasUser) : true;

    const dateMatched = (new Date(work.endDate) >= new Date(range.value[0]) &&
        new Date(work.startDate) <= new Date(range.value[1]))

    return userMatched && dateMatched;
  });

  // 배열 교체 시 반응성을 유지하기 위해 splice 사용
  works.splice(0, works.length, ...filtered);
};

const stopProgressAnimation = (contentEle) => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
    progressState = 0;
    isProgressing.value = false;
    progressText.value = '';
  }
};

let submitControll = true;

let chatResult = "";
let visibleText = "";
let insideJsonBlock = false;
/** 제출 처리 */
async function submitAI() {
  if(submitControll === false) return;

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
    content: "업무를 조회 중 입니다...",
  });

  try {

    // 업무 요약 텍스트로 변환 (HTML 제거 포함)
    const worksSummary = works
      .map((work, idx) => {
        const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        let users = `${work.users}`;
        return `
                {id: ${idx + 1}}, 
                {statusName: ${work.statusName}}, 
                {status: ${work.status}}, 
                {type: ${work.type}} - 
                {title: ${work.title}} ,
                (period: ${work.startDate} ~ ${work.endDate}),
                {content: ${textContent}},
                {startDate: ${work.startDate}},
                {endDate: ${work.endDate}},
                {progress: ${work.progress}%},
                {users: ${users}}`;
      }).join("\n\n");

    const body = {
        system: kanbanScenarios,        
        history: [],
        user: aiText.value,
        works: works
    };

    const prompt = [
      {
        role: "user",
        content: `${body.system}\n\n업무 목록:\n${worksSummary}\n\n사용자 질문:\n${body.user}`
      }
    ];      

    submitControll = false;

    startProgressAnimation(aiResult); // 프로그레스 시작
    is_end.value = true;
    const res = await fetch("/api/bedrock-common", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt)
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    chatResult = "";

    while (true) {
      stopProgressAnimation(aiResult);      
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

    aiText.value = "";
  } catch (e) {
    console.error("AI 요청 중 오류 발생:", e);
  } finally {
    submitControll = true;
    progressText.value = "";
    stopProgressAnimation(aiResult);
    is_end.value = false;
    loading.value = false;
  }
}

//
async function helpRegWork() {
  if(submitControll === false) return;

  helpLoading.value = true;
  const id = works.length+1;
  let content;
  try {

    content = `${helpRegScnarios(id, JSON.stringify(helpWorks))}\n\n {today: ${todayFormat}}`;

    const prompt = [
      {
        role: "user",
        content: content
      }
    ];      

    submitControll = false;

    const res = await fetch("/api/bedrock-common", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    chatResult = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chatResult += decoder.decode(value);

      await nextTick();
    }    

    chatResult = cleanClaudeResponse(chatResult);
    const resultArray = JSON.parse(JSON.stringify(chatResult));    
    allWorks.value.push(...resultArray); // 기존 업무에 덧붙이기    
    works.splice(0, works.length, ...allWorks.value); //원본데이터를 다시 넣는 형태

  } catch (e) {
    console.error("AI 요청 중 오류 발생:", e);
  } finally {
    submitControll = true;
    helpLoading.value = false;
  }
}

const cleanClaudeResponse = function(text) {
  try {
    // ```json ~ ``` 으로 감싸진 경우
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) return JSON.parse(codeBlockMatch[1]);

    // 대괄호 [ ] 로 시작하는 JSON 배열만 추출
    const jsonMatch = text.match(/\[\s*{[\s\S]*?}\s*]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    throw new Error("JSON 구조를 찾을 수 없습니다.");
  } catch (e) {
    console.error("cleanClaudeResponse 파싱 실패:", e);
    return [];
  }
}

// 이번 주 날짜 배열을 생성하는 함수
const getThisWeekDates = function(today = new Date()) {
  const dates = [];
  
  // 현재 날짜의 요일 구하기 (0: 일요일, 1: 월요일, ..., 6: 토요일)
  const dayOfWeek = today.getDay();
  
  // 이번 주 월요일 날짜 계산 (월요일을 주의 시작으로 설정)
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  
  // 월요일부터 일요일까지 7일간 배열에 추가
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    
    // YYYY-MM-DD 형식으로 변환
    const formattedDate = date.toISOString().split('T')[0];
    dates.push(formattedDate);
  }
  
  return dates;
}

// 월요일부터 일요일까지 (한국 기준)
const thisWeekFromMonday = getThisWeekDates(today);

const clearAllAnswersContent = () => {
  filteredAiResult.value.forEach(item => {
    item.content = "";
  });
};


/** 제출 처리 */
async function summaryCallAI(type) {
  if(submitControll == false) return;
  clearAllAnswersContent();
  let question = "";
  let scenario;
  let charge;
  let content;
  try {

    // 업무 요약 텍스트로 변환 (HTML 제거 포함)
    const worksSummary = works
      .map((work, idx) => {
        const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        let users = `${work.users}`;
        return `
                {id: ${idx + 1}}, 
                {statusName: ${work.statusName}}, 
                {status: ${work.status}}, 
                {type: ${work.type}} - 
                {title: ${work.title}} ,
                (period: ${work.startDate} ~ ${work.endDate}),
                {content: ${textContent}},
                {startDate: ${work.startDate}},
                {endDate: ${work.endDate}},
                {progress: ${work.progress}%},
                {users: ${users}}`;
      }).join("\n\n");

    if(type === 1){ //오늘 내가 할일
      question = `오늘 담당자가 해야할 업무를 요약해줘.`
      scenario = todayWorkScnarios;
      charge = "나웅진";
      content = `${scenario(worksSummary)}\n\n 사용자 질문:${question} \n\n {today: ${todayFormat}} \n\n {user: ${charge}}`;
    }else if(type === 2){
      question = `이번 주에 담당자가 해야할 업무를 요약해줘.`
      scenario = weekWorkScnarios;
      charge = "나웅진";
      content = `${scenario(worksSummary)}\n\n 사용자 질문:${question} \n\n {thisWeek: ${thisWeekFromMonday}}, \n\n {today: ${todayFormat}}  \n\n {user: ${charge}}`;
    }else if (type ===3){
      question = `오늘 해야할 업무를 요약해줘. 오늘 날짜는 ${todayFormat} 이야`
      scenario = deptWorkScnarios;
      content = `${scenario(worksSummary)}\n\n 사용자 질문:${question} \n\n {today: ${todayFormat}}`;
    }

    loading.value = true;

    filteredAiResult.value.push({
      type: "system",
      contentType: "text",
      content: "",
    });

    const prompt = [
      {
        role: "user",
        content: content
      }
    ];      

    submitControll = false;

    startProgressAnimation(filteredAiResult);
    is_summary_end.value = true;
    
    const res = await fetch("/api/bedrock-common", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt)
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    chatResult = "";

    while (true) {
      stopProgressAnimation(filteredAiResult);
      const { done, value } = await reader.read();
      if (done) break;

      chatResult += decoder.decode(value);

      filteredAiResult.value[filteredAiResult.value.length - 1].content = chatResult;
      filteredAiResult.value[filteredAiResult.value.length - 1] = JSON.parse(JSON.stringify(filteredAiResult.value[filteredAiResult.value.length - 1]));
      summaryCallCnt = summaryCallCnt+1

      await nextTick();
      if (resultBox2.value) {
        resultBox2.value.scrollTop = resultBox2.value.scrollHeight;
      }            
    }
  } catch (e) {
    console.error("AI 요청 중 오류 발생:", e);
  } finally {
    submitControll = true;
    summaryCallCnt = 0;
    is_summary_end.value = false;
    stopProgressAnimation(filteredAiResult);
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
  createItem.value = {
    id: works.length + 1,
    type: "개발", // newwork에서 복사하거나 기본값 설정
    title: newwork.title,
    status: 1, // 숫자 상태값
    statusName: "대기 업무",
    color: "infoColor", // 기본 색상 지정
    progress: 0,
    users: ["나웅진"], // 현재 사용자로 기본 설정
    startDate: new Date().toISOString().split("T")[0],
    endDate: "", // 필요시 설정
    content: ""
  };

  showModal.value = true;
  selectedItem.value = createItem.value;
  updateMode.value = true; // 새로 등록할 때는 수정 모드로 전환
  editor.commands.setContent("1.");
};

function regWork(){
  showModal.value = false;
  works.push(createItem.value);
}

// function registerwork() {
//   showModal.value = true;
//   updateMode.value = true; // 새로 등록할 때는 수정 모드로 전환
//   // 간단한 유효성 검사 및 id 생성
//   createItem.value = JSON.parse(JSON.stringify(newwork)); // JSON 파싱하여 값 복사
//   createItem.value.id = works.length + 1; // 새로운 ID 설정
//   createItem.value.date = new Date().toISOString().split("T")[0]; // 현재 날짜 설정
//   createItem.value.status = "대기 업무"; // 기본 상태 설정
//   createItem.value.content = ""; // 내용 초기화 (원하는 기본 내용으로 설정하셔야 합니다)
//   createItem.value.procName = sessionUser.value.name; // 현재 사용자 이름으로 처리자 설정

//   selectedItem.value = works[works.length - 1]; // 선택된 항목 업데이트
//   editor.commands.setContent(works[works.length - 1].content || ""); // 에디터 내용 설정
// };

// function regWork(){
//   showModal.value = false;
//   works.push(createItem.value);
// }

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
  const work = works.find((c) => c.id === draggedId);
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

let summaryCallCnt = 0;
// 메뉴 열릴 때 함수 호출
watch(showMenu, (val) => {
  if (summaryCallCnt == 0 && val) {
    summaryCallAI(1)
  }
})

// 날짜를 mm.dd 형식으로 변환하는 함수
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}.${dd}`
}

const addComment = (work) => {
  if (!work.newComment || !work.newComment.trim()) return;
  if (!work.comments) work.comments = [];

  work.comments.push({
    author: sessionUser.value.name,
    date: new Date().toISOString().split('T')[0],
    content: work.newComment.trim(),
    registrant: "나웅진" // 등록자 
  });

  work.newComment = "";
};

const addReply = (comment) => {
  if (!comment.newReply || !comment.newReply.trim()) return;
  if (!comment.replies) comment.replies = [];

  comment.replies.push({
    author: sessionUser.value.name,
    date: new Date().toISOString().split('T')[0],
    content: comment.newReply.trim(),
    registrant: "나웅진" // 등록자 추
  });

  comment.newReply = "";
};
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


