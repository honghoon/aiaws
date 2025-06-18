<template>
  <div class="relative">
    <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
      
      <div class="min-h-[calc(100vh-230px)] h-[calc(100vh-230px)] flex gap-3 bg-gray-100 rounded-md shadow-sm p-3">
        <div class="bg-white flex-1 flex flex-col rounded-md w-full h-full overflow-y-auto overflow-x-hidden">
          <div class="p-4 space-y-4">
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
            <p>여기에 스크롤되는 내용이 들어갑니다.</p>
          </div>
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

// Ionicons
import { IonIcon } from '@ionic/vue'
import { textOutline, ellipsisHorizontalOutline, removeOutline, listOutline, linkOutline } from 'ionicons/icons'


const textareaMaxHeight = 100;
const aiText = ref("")
const aiResult = ref('')

async function submitAI() {
  aiResult.value = ''
  const res = await fetch('/api/bedrock-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '여기에 프롬프트 입력' }),
  })

  if (!res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    aiResult.value += decoder.decode(value)
  }
}
</script>
