<template>
  <div class="relative">
    <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
      <div class="flex pb-3 justify-end gap-3">
        <n-button strong secondary round type="primary" @click="submitAI('default')">
          AI 주간보고 생성하기
        </n-button>
        
        <n-button strong secondary round type="primary" @click="submitAI('all')">
          AI 주간보고 취합하기
        </n-button>

        <n-button strong secondary round type="tertiary" @click=" () => { submitOption = '저장'; submitToLeader = true }">
          임시저장
        </n-button>
        <n-button strong secondary round type="info" @click=" () => { submitOption = '제출'; submitToLeader = true }">
          주간보고
        </n-button>
          <!-- 주간보고 제출 팝업창 -->
        <n-modal
          v-model:show="submitToLeader"
          preset="dialog"
          title="확인"
          :content="submitOption === '저장'
          ? '임시 저장 하겠습니까?'
          : '주간보고를 제출하시겠습니까?'"
          positive-text="확인"
          negative-text="취소"
          @positive-click="submitCallback"
        />
      </div>
      <div class="max-h-[calc(100vh-320px)] flex gap-3">
        <!-- 전주 -->
       <div class="flex-1 flex flex-col bg-gray-100 shadow-sm p-3 rounded-md">
        <h2 class="text-sm font-semibold mb-2">전주 주간보고</h2>
        <div class="flex-1 overflow-y-auto pr-2  max-h-[calc(100vh-350px)]" >
          <n-card
            v-for=" (work, index) in getWorksByStatus()"
            :key="work.id"
            :title="`[${work.type}]`"
            size="small"
            class="w-full font-semibold text-xl mb-3"
            hoverable
            round
            style="font-weight: bold;"
          >
            <n-space vertical size="small">
            <div>{{ work.title }}</div>
              <n-space align="center" justify="space-between">
                <n-tag size="small" type="info" round>
                  기간: {{ work.startDate }} ~  {{ work.endDate }}
                </n-tag>
                <n-tag size="small" type="error" round>
                  진행률: {{ work.progress }}%
                </n-tag>
              </n-space>
              <div class="text-gray-500">
                <div v-for="(line, idx) in contentToLines(work.content)" :key="idx" >
                   {{idx + 1 }} . {{ line }} <br />
                </div>
                  ＊ 현황: {{ work.statusName }} <br />
              </div>
            </n-space>
        </n-card>
      </div>
      </div>
        <!-- 금주 -->
        <div class="flex-1 flex flex-col bg-gray-100 shadow-sm p-3 rounded-md">
          <h2 class="text-sm font-semibold mb-2">금주 주간보고</h2>
          <div class="sticky top-0 z-10 flex gap-2 bg-white py-2 px-4 border-b border-gray-200 max-h-[calc(100vh-350px)]">
            <!-- 굵게: textOutline -->
            <n-button quaternary size="small" @click="editorThis.chain().focus().toggleBold().run()">
              <IonIcon :icon="textOutline" class="text-xl" />
            </n-button>
            <!-- 기울임: ellipsisHorizontalOutline(대체) -->
            <n-button quaternary size="small" @click="editorThis.chain().focus().toggleItalic().run()">
              <IonIcon :icon="ellipsisHorizontalOutline" class="text-xl" />
            </n-button>
            <!-- 밑줄: removeOutline(대체) -->
            <n-button quaternary size="small" @click="editorThis.chain().focus().toggleUnderline().run()">
              <IonIcon :icon="removeOutline" class="text-xl" />
            </n-button>
            <!-- 리스트: listOutline -->
            <n-button quaternary size="small" @click="editorThis.chain().focus().toggleBulletList().run()">
              <IonIcon :icon="listOutline" class="text-xl" />
            </n-button>
            <!-- 링크: linkOutline -->
            <n-button quaternary size="small" @click="
              (() => {
                const url = prompt('링크 주소를 입력하세요:')
                if (url) editorThis.chain().focus().setLink({ href: url }).run()
              })()
              ">
              <IonIcon :icon="linkOutline" class="text-xl" />
            </n-button>
          </div>
          <editor-content :editor="editorThis"
            class="h-[calc(100vh-350px)] overflow-y-auto flex max-h-full p-3 rounded bg-white" />
        </div>
        <!-- 차주 -->
        <div class="flex-1 flex flex-col bg-gray-100 shadow-sm p-3 rounded-md">
          <h2 class="text-sm font-semibold mb-2">차주 주간보고</h2>
          <div class="sticky top-0 z-10 flex gap-2 bg-white py-2 px-4 border-b border-gray-200 max-h-[calc(100vh-350px)]">
            <!-- 굵게: textOutline -->
            <n-button quaternary size="small" @click="editorNext.chain().focus().toggleBold().run()">
              <IonIcon :icon="textOutline" class="text-xl" />
            </n-button>
            <!-- 기울임: ellipsisHorizontalOutline(대체) -->
            <n-button quaternary size="small" @click="editorNext.chain().focus().toggleItalic().run()">
              <IonIcon :icon="ellipsisHorizontalOutline" class="text-xl" />
            </n-button>
            <!-- 밑줄: removeOutline(대체) -->
            <n-button quaternary size="small" @click="editorNext.chain().focus().toggleUnderline().run()">
              <IonIcon :icon="removeOutline" class="text-xl" />
            </n-button>
            <!-- 리스트: listOutline -->
            <n-button quaternary size="small" @click="editorNext.chain().focus().toggleBulletList().run()">
              <IonIcon :icon="listOutline" class="text-xl" />
            </n-button>
            <!-- 링크: linkOutline -->
            <n-button quaternary size="small" @click="
              (() => {
                const url = prompt('링크 주소를 입력하세요:')
                if (url) editorNext.chain().focus().setLink({ href: url }).run()
              })()
              ">
              <IonIcon :icon="linkOutline" class="text-xl" />
            </n-button>
          </div>
          <editor-content :editor="editorNext"
            class="h-[calc(100vh-350px)] overflow-y-auto flex max-h-full p-3 rounded bg-white" />
        </div>
      </div>
      <br/>
      <!-- 주간보고 수정 체크 -->
      <n-space>
        <n-radio
          :checked="checkedValue === 'thisweek'"
          value="thisweek"
          name="basic-demo"
          @change="handleChange"
        >
          금주
        </n-radio>
        <n-radio
          :checked="checkedValue === 'nextweek'"
          value="nextweek"
          name="basic-demo"
          @change="handleChange"
        >
         차주
        </n-radio>
      </n-space>

      <textarea v-model="aiText" rows="4"
        class="mt-3 w-full resize-none rounded-lg bg-gray-100 px-3 py-2 pr-10 text-sm focus:outline-none"
        @input="autoResize" 
        placeholder="AI에게 물어보세요..."
        @keydown.enter.exact="submitAI('')"
        @keydown.shift.enter.stop
        :style="{ 'max-height': textareaMaxHeight + 'px' }" 
        ></textarea>
      <!-- 보내기 버튼 (아이콘) -->
      <button @click="submitAI('')"
        class="absolute bottom-15 right-8 flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded-full hover:bg-blue-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-label="보내기">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
</style>

<script setup>




defineProps({
  category: String,
  items: Array
})
import { ref, onMounted, onBeforeUnmount, defineComponent} from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { NButton } from 'naive-ui'
import { useMessage } from 'naive-ui'

// Ionicons
import { IonIcon } from '@ionic/vue'
import { textOutline, ellipsisHorizontalOutline, removeOutline, listOutline, linkOutline } from 'ionicons/icons'

// 할일데이터
import { useWorkStore } from '~/stores/work';
// 프롬프트 자료
import { aboutScenarios, aboutUpdateScenarios } from '~/utils/prompts/about_secenarios.js';





const workStore = useWorkStore()
const works = computed(() => workStore.works)

const message = useMessage()
const submitToLeader = ref(false);
const submitOption = ref(null); 



// 수정할 주간보고 값
const checkedValue = ref('')  // 기본값 설정
function handleChange(e) {
  checkedValue.value = e.target.value
}
function submitCallback () {
     message.success(submitOption.value === '저장' ? '임시저장되었습니다.' : '제출되었습니다.');
}

const extensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
  }),
  TextStyle,
  Color,
  ListItem,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight,
  Underline,
  Link,
]

const editorThis = new Editor({
  extensions,
  content: '<p>금주 업무 내용을 작성하세요...</p>',
})
const editorNext = new Editor({
  extensions,
  content: '<p>차주 계획을 작성하세요...</p>',
})

// 마운트 해제 시 destroy
onBeforeUnmount(() => {
  editorThis.destroy()
  editorNext.destroy()
})

const textareaMaxHeight = 100;
const aiText = ref("")
const loading = ref(false);
const useUserFillter = ref("");

const today = new Date().toISOString().split('T')[0]; // "2025-06-26"

// 오늘 날짜 기준
const todayDate = new Date();

// 이번 주 월요일
const thisWeekStart = new Date(todayDate);
const day = thisWeekStart.getDay(); // 0:일 ~ 6:토
const diffToMonday = (day + 6) % 7; // 월요일까지의 차이 계산
thisWeekStart.setDate(thisWeekStart.getDate() - diffToMonday);

// 각 주간 종료일 (일요일)
const thisWeekEnd = new Date(thisWeekStart);
thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

// 지난 주 월요일
const lastWeekStart = new Date(thisWeekStart);
lastWeekStart.setDate(lastWeekStart.getDate() - 7);

// 지난 주 일요일
const lastWeekEnd = new Date(lastWeekStart);
lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

// 다음 주 월요일
const nextWeekStart = new Date(thisWeekStart);
nextWeekStart.setDate(nextWeekStart.getDate() + 7);

const nextWeekEnd = new Date(nextWeekStart);
nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

// 날짜 비교 함수
const isWithin = (dateStr, start, end) => {
  const date = new Date(dateStr);
  return date >= start && date <= end; 
};


function getWorksByStatus() {
  const data =  works.value.filter(work => {
                 const inRange = isWithin(work.startDate, lastWeekStart, lastWeekEnd) || isWithin(work.endDate, lastWeekStart, lastWeekEnd);
                 const includesUser = work.users?.some(user => user.includes('나웅진'));
    return inRange && includesUser;
  });
  return data;
}

function contentToLines(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // <p> 태그를 찾아서 텍스트만 추출
  const paragraphs = tempDiv.querySelectorAll('p');
  return Array.from(paragraphs)
    .map(p => p.textContent.trim())
    .filter(line => line); // 빈 줄 제거
}


// HTML 형식으로 변경
function extractSummaryFromHTML(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const blocks = tempDiv.querySelectorAll("strong, p");
  let summary = "";
  let section = "";

  blocks.forEach((el) => {
    const text = el.innerText.trim();
    if (!text) return;

    if (text.startsWith("[")) {
      // 유형 구분
      section += `\n${text}\n`;
    } else if (/^\d+\./.test(text)) {
      section += `${text}\n`;
    } else {
      section += `${text}\n`;
    }
  });

  summary += section.trim();

  return summary;
}


// 로딩바 
let progressState = 0;
let progressInterval = null;

const isProgressing = ref(false);
const progressText = ref(''); // 계속 갱신될 텍스트 (⠋ 분석 중...)

const startProgressAnimation = (contentEle) => {  
  isProgressing.value = true;
  progressState = 0;

  progressInterval = setInterval(() => {
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    progressText.value = `AI에게 요청 중입니다... ${spinners[progressState % spinners.length]}`;
    contentEle.commands.setContent(progressText.value);
    progressState++;
  }, 100);
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

/** 제출 처리 **/
async function submitAI(val) {
  console.log("val : " , val);
  // 입력창 텍스트입력을 통해 AI 사용 시 
  if(val !='default' && val != 'all'){
    if (!aiText.value.trim() || loading.value) return;
  }

  if(val == ''){ 
      if(!checkedValue.value.trim()){
         alert("수정할 주간보고를 선택해주세요 ");
         return;
      }
      let textContent = '';
      let beforeWeek = '';
      let afterWeek = '';
      let editor = checkedValue.value  == 'thisweek' ? editorThis : editorNext
      if(checkedValue.value == 'thisweek'){
          if(editorThis.getHTML().indexOf('금주 업무 내용을 작성하세요') != -1){
            alert("금주 작성된 주간보고가 없습니다");
            return 
          }
         textContent = editorThis.getHTML();
         beforeWeek  =thisWeekStart; afterWeek = thisWeekEnd;
      }else{
          if(editorNext.getHTML().indexOf('차주 계획을 작성하세요') != -1){
            alert("차주 작성된 주간보고가 없습니다");
            return 
          }
          textContent = editorNext.getHTML();
          beforeWeek  = nextWeekStart; afterWeek = nextWeekEnd;
      }
      await callBedRockByObject(setFillterWorks(beforeWeek, afterWeek, val), aboutUpdateScenarios, editor, aiText.value, extractSummaryFromHTML(textContent));
  }else{
      useUserFillter.value = val; // 기존에 검새하던 기준 저장용

      const test = setFillterWorks(thisWeekStart, thisWeekEnd, val);
      // 금주 주간보고 업무 요청
      await  callBedRockByObject(test, aboutScenarios, editorThis, '금주 주간보고 작성해줘', '');
      // 차주 주간보고 업무 요청
      await  callBedRockByObject(setFillterWorks(nextWeekStart, nextWeekEnd, val), aboutScenarios, editorNext, '차주 주간보고 작성해줘', '');
  }


  // 데이터(works) 필터 처리 함수
  function setFillterWorks(startWeek, endWeek){
    const isUserFilter = useUserFillter.value == 'default' ? true : false;
    console.log("useUserFillter.value  : " , isUserFilter ? "특정 사용자 주간보고" : "전체 주간보고" );
    const filterUserName = '나웅진';
    return works
            .filter(work => {
              const inRange = isWithin(work.startDate, startWeek, endWeek) || isWithin(work.endDate, startWeek, endWeek);
              const includesUser = work.users?.some(user => user.includes(filterUserName));
              return inRange && (
                isUserFilter 
                  ? includesUser       // '나웅진' 포함된 항목만
                  : !includesUser      // '나웅진'이 없는 항목만
              );
            })
            .map((work, idx) => {
            const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            return `${idx + 1}. [${work.statusName}] ${work.type} - ${work.title} (기간: ${work.startDate} ~ ${work.endDate})\n${textContent}  진행률: ${work.progress}% ) \n담당자: ${work.users}`;
          })
          .join("\n\n");
  }


  // Bedrock 호출 공통 함수
  async function callBedRockByObject(works, scenarios, editor, request, asIsEditor){
    // 프롬프트 설정
    const prompt = [];
    const messages = scenarios
             .replace('{today}', today) 
             .replace('{tasks}', JSON.stringify(works))
             .replace('{editor}', asIsEditor)
            + `\n\n[사용자 요청]\n${request}`;
    prompt.push({"role": "user", "content": "\n\n업무목록:" + JSON.stringify(works) + messages });


    // BedRock API호출
    startProgressAnimation(editor); // 프로그레스 시작
    const res = await fetch('/api/bedrock-common', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
    const reader =  res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      loading.value = false;
      return;
    }

    try {
      let  fullContent = ''; // 누적할 변수
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value);
      }
      stopProgressAnimation(editor);
      editor.commands.setContent(fullContent);
    } finally {
      progressText.value = "";
      stopProgressAnimation(editor);
      loading.value = false;
    }

  }
}
</script>

<style>
/* 포커스 스타일 제거 */
.ProseMirror:focus {
  outline: none;
}
</style>