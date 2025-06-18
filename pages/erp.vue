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
              
              <div class="flex-1" v-else>
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

async function submitAI() {
  
  if (!aiText.value.trim() || loading.value == true) {
    return; // 입력이 비어있으면 아무 작업도 하지 않음
  }

  loading.value = true;

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
