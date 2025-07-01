<template>
  <div class="relative">
    <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
      <div class="flex pb-3 justify-end gap-3">
        <n-button strong secondary round type="primary">
          AI 주간보고 생성하기
        </n-button>
        
        <n-button strong secondary round type="primary">
          AI 주간보고 취합하기
        </n-button>

        <n-button strong secondary round type="tertiary">
          임시저장
        </n-button>
        <n-button strong secondary round type="info">
          주간보고
        </n-button>
      </div>
      <div class="min-h-[calc(100vh-280px)] flex gap-3">
        <!-- 전주 -->
        <div class="flex-1 flex flex-col bg-gray-100 shadow-sm p-3 rounded-md">
          <h2 class="text-sm font-semibold mb-2">전주 주간보고</h2>
          <editor-content v-if="editorLast" :editor="editorLast"
            class="h-[calc(100vh-320px)] overflow-y-auto flex max-h-full p-3 rounded bg-white" />
        </div>
        <!-- 금주 -->
        <div class="flex-1 flex flex-col bg-gray-100 shadow-sm p-3 rounded-md">
          <h2 class="text-sm font-semibold mb-2">금주 주간보고</h2>
          <div class="sticky top-0 z-10 flex gap-2 bg-white py-2 px-4 border-b border-gray-200">
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
          <div class="sticky top-0 z-10 flex gap-2 bg-white py-2 px-4 border-b border-gray-200">
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
      <textarea v-model="aiText" rows="4"
        class="mt-3 w-full resize-none rounded-lg bg-gray-100 px-3 py-2 pr-10 text-sm focus:outline-none"
        @input="autoResize" 
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
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

// Ionicons
import { IonIcon } from '@ionic/vue'
import { textOutline, ellipsisHorizontalOutline, removeOutline, listOutline, linkOutline } from 'ionicons/icons'


// 할일데이터
import { useWorkStore } from '~/stores/work';
// 프롬프트 자료
import { aboutScenarios } from '~/utils/prompts/about_secenarios.js';

const workStore = useWorkStore()
const works = workStore.works


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

// 각 주간 보고 에디터
const editorLast = new Editor({
  extensions,
  content: '<p>전주 업무 내용을 작성하세요...</p>',
  editable: false, // 읽기 전용
});

editorLast.commands.insertContent('[개발]<br/>');
editorLast.commands.insertContent('1.<br/>');
editorLast.commands.insertContent('추가할 문자열입니다.<br/>');
editorLast.commands.insertContent('추가할 문자열입니다.<br/>');
editorLast.commands.insertContent('추가할 문자열입니다.<br/>');

editorLast.im
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
  editorLast.destroy()
  editorThis.destroy()
  editorNext.destroy()
})

const textareaMaxHeight = 100;
const aiText = ref("")
const aiResult = ref([])
const loading = ref(false);
const today = new Date().toISOString().split('T')[0]; // "2025-06-26"
const keywords = ["운영", "기획", "개발", "완료", "테스트"];
const pattern = new RegExp(`\\[(${keywords.join("|")})\\]`, "g");


// 유틸: 해당 날짜가 이번 주인지 확인
// function isThisWeek(dateStr) {
//   const todays= new Date();
//   const inputDate = new Date(dateStr);
//   const dayOfWeek = todays.getDay(); // 0(일) ~ 6(토)
  
//   const startOfWeek = new Date(todays);
//   startOfWeek.setDate(todays.getDate() - dayOfWeek); // 일요일
//   const endOfWeek = new Date(startOfWeek);
//   endOfWeek.setDate(startOfWeek.getDate() + 6); // 토요일

//   return inputDate >= startOfWeek && inputDate <= endOfWeek;
// }



async function callBedRock() {


}


/** 제출 처리 **/
async function submitAI() {

  if (!aiText.value.trim() || loading.value) return;

  // aiResult.value.push({
  //   type: 'user',
  //   contentType: 'text',
  //   content: aiText.value
  // })

  // aiText.value = "";

  // aiResult.value.push({
  //   type: 'system',
  //   contentType: 'text',
  //   content: "AI 응답을 기다리는 중...",
  //   proc: true
  // })
  
  // for(let item of aiResult.value){
  //   if(item.proc == undefined){
  //     if (item.type === "user"){
  //       prompt.push({"role": "user", "content" : item.content})
  //     }
  //     if (item.type === "system"){
  //       prompt.push({"role": "assistant", "content" : item.content})
  //     }
  //   }
  // }

  let prompt = []

  // 업무 요약 텍스트로 변환 (HTML 제거 포함)
  // const worksSummary = works
  //     .filter(work =>
  //             isThisWeek(work.startDate) || isThisWeek(work.endDate)
  //     )
  //     .map((work, idx) => {
  //       const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  //       return `${idx + 1}. [${work.statusName}] ${work.type} - ${work.title} (기간: ${work.startDate} ~ ${work.endDate})\n${textContent} 진행률: ${work.progress}% ) 키: ${work.id}`;
  //     })
  //     .join("\n\n");

  //  const worksSummary = works.map((work, idx) => {
  //       const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  //       return `${idx + 1}. [${work.statusName}] ${work.type} - ${work.title} (기간: ${work.startDate} ~ ${work.endDate})\n${textContent} 진행률: ${work.progress}% ) 키: ${work.id}`;
  //     })
  //     .join("\n\n");

  

  // 오늘 날짜 기준
  const todayDate = new Date();

  // 이번 주 월요일
  const thisWeekStart = new Date(todayDate);
  const day = thisWeekStart.getDay(); // 0:일 ~ 6:토
  const diffToMonday = (day + 6) % 7; // 월요일까지의 차이 계산
  thisWeekStart.setDate(thisWeekStart.getDate() - diffToMonday);

  // 지난 주 월요일
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  // 다음 주 월요일
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  // 각 주간 종료일 (일요일)
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

 // const lastWeekEnd = new Date(lastWeekStart);
  //lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  // 날짜 비교 함수
  const isWithin = (dateStr, start, end) => {
    const date = new Date(dateStr);
    return date >= start && date <= end;
  };

  // 주간 필터링
  //const lastWeekWorks = works.filter(work => isWithin(work.startDate, lastWeekStart, lastWeekEnd));
  const thisWeekWorks = works.filter(work => isWithin(work.startDate, thisWeekStart, thisWeekEnd))
                  .map((work, idx) => {
                  const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                  return `${idx + 1}. [${work.statusName}] ${work.type} - ${work.title} (기간: ${work.startDate} ~ ${work.endDate})\n${textContent} 진행률: ${work.progress}% ) 키: ${work.id}`;
                })
                .join("\n\n");
  const nextWeekWorks = works.filter(work => isWithin(work.startDate, nextWeekStart, nextWeekEnd))  .map((work, idx) => {
                        const textContent = work.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                        return `${idx + 1}. [${work.type}] ${work.title} (기간: ${work.startDate} ~ ${work.endDate})\n${textContent} 진행률: ${work.progress}% ) 키: ${work.id}`;
                      })
                      .join("\n\n");



  // 금주 주간보고
  let messages = aboutScenarios
    // .replace('{history}', history)
    // .replace('{toMessage}', toMessage)
  .replace('{today}', today)
  .replace('{tasks}', JSON.stringify(thisWeekWorks))
 // .replace('{thisWeekWorks}', thisWeekWorks);

  prompt.push({"role": "user", "content": "\n\n업무목록:" +  messages + thisWeekWorks});


  let res = await fetch('/api/bedrock-common', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt),
  });

  let reader = res.body?.getReader();
  let decoder = new TextDecoder();

  if (!reader) {
    loading.value = false;
    return;
  }

  try {
    let fullContent = ''; // 누적할 변수

    while (true) {
      let { done, value } = await reader.read();
      if (done) break;
      let chunk = decoder.decode(value);

      // 숫자 항목 앞에 줄바꿈 삽입: " 1." or "\n1." 형태
      //chunk = chunk.replace(/(\d+)\.\s*/g, '\n$1. ');
      //chunk = chunk.replace(pattern, '\n[$1]');

      fullContent += chunk;
    }
    editorThis.commands.setContent(fullContent);
 
  } finally {
    loading.value = false;
  }


  // 차주 주간보고
  messages = aboutScenarios
    // .replace('{history}', history)
    // .replace('{toMessage}', toMessage)
    .replace('{today}', today);


  prompt = [];
  prompt.push({"role": "user", "content": "\n\n업무목록:" + nextWeekWorks + messages });


  res = await fetch('/api/bedrock-common', {
  //res = await fetch('/api/bedrock-stream', {  
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt),
  });

  reader = res.body?.getReader();
  decoder = new TextDecoder();

  if (!reader) {
    loading.value = false;
    return;
  }

  try {
    let fullContent = ''; // 누적할 변수

    while (true) {
      let { done, value } = await reader.read();
      if (done) break;
      let chunk1 = decoder.decode(value);

      // 숫자 항목 앞에 줄바꿈 삽입: " 1." or "\n1." 형태
      //chunk = chunk.replace(/(\d+\.\s)/g, '\n$1');
      //chunk = chunk.replace(pattern, '\n[$1]');

      fullContent += chunk1;

    }
    editorNext.commands.setContent(fullContent);
 
  } finally {
    loading.value = false;
  }

}
</script>

<style>
/* 포커스 스타일 제거 */
.ProseMirror:focus {
  outline: none;
}
</style>