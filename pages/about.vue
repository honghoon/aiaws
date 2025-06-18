<template>
  <div class="relative">
    <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
      <div class="flex pb-3 justify-end gap-3">
        <n-button strong secondary round type="primary">
          AI 주간보고 생성하기
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
        @input="autoResize" placeholder="AI에게 물어보세요..." :style="{ 'max-height': textareaMaxHeight + 'px' }" />
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
})
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
</script>

<style>
/* 포커스 스타일 제거 */
.ProseMirror:focus {
  outline: none;
}
</style>