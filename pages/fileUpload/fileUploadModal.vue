<template>
  <n-modal
    v-model:show="localShow"
    preset="dialog"
    title="업무 파일 업로드"
    @close="emit('close')"
  >
    <!-- ✅ 이 영역이 있어야 기본 슬롯 에러 안남 -->
    <div>
      <n-upload
        accept=".eml,.txt,.doc,.docx"
        action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
        list-type="image"
        show-download-button
        @download="handleDownload"
        @finish="handleUploadFinish"
        @change="handleFileChange"
        multiple
      >
      <n-button strong secondary round type="primary">업로드</n-button>

      </n-upload>
        <div class="flex p-2 gap-3 items-center justify-end">
          <span
            v-if="isProgressing"
            class="text-xs text-slate-500 font-mono whitespace-nowrap"
            style="min-width: 130px"
          >
            {{ progressText }}
          </span>          
          <n-button
            strong
            secondary
            :disabled="isDisabled"
            type="info"
            v-if="updateMode"
            @click="submitAI"
          >
            확인
          </n-button>
          <n-button
            strong
            secondary
            :disabled="isDisabled"
            type="warning"
            v-if="updateMode"
            @click="localShow = false"
          >
            닫기
          </n-button>
        </div>  
    </div>
  </n-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useWorkStore } from '~/stores/work';

const workStore = useWorkStore()
const works = workStore.works

defineOptions({ name: 'FileUploadModal' })
const props = defineProps({ show: Boolean })
const emit = defineEmits(['close', 'fileUploaded'])

const localShow = ref(props.show)
const updateMode = ref(false)
const isDisabled = ref(false)
const fileList = ref([])

const worksFile = ref([])
const aiResult = ref([])

let progressState = 0;
let progressInterval = null;

// 다양한 프로그레스 표현 방식
const progressTypes = {
  spinner: () => {
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return `\n\n${spinners[progressState % spinners.length]} 업무 등록 중...`;
  },
};
const selectedProgressType = 'spinner';

// 함수 시작 부분에 변수들 선언
let visibleText = '';
const isProgressing = ref(false);
const progressText = ref(''); // 계속 갱신될 텍스트 (⠋ 분석 중...)

const startProgressAnimation = () => {
  isProgressing.value = true;
  progressState = 0;

  progressInterval = setInterval(() => {
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    progressText.value = `${spinners[progressState % spinners.length]} 업무 업로드 중...`;
    progressState++;
  }, 200);
};

const stopProgressAnimation = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
    progressState = 0;
    isProgressing.value = false;
    progressText.value = '';
  }
};

// 함수 시작 부분에 변수들 선언
let chatResult = '';

/** 제출 처리 */
async function submitAI() {
  isDisabled.value = true;
  aiResult.value.push({
    type: "user",
    contentType: "text",
    content: "첨부파일을 분석해서 주간보고 업무를 등록할 수 있게 프롬프트에 맞게 리턴해줘",
  });

  aiResult.value.push({
    type: "system",
    contentType: "text",
    content: "AI 응답을 기다리는 중...",
  });

  const id = works.length+1;

  try {
    const reportsText = worksFile.value.map((text, idx) => `### 보고서 ${idx + 1}:\n${text.trim()}`).join('\n\n');

    const fullPrompt = `
      당신은 업무 보고를 작성하는 AI입니다. 아래의 보고서들을 각각 하나의 JSON 객체로 변환해 주세요.
      각 보고서는 아래의 형식에 따라 작성되어야 합니다. 결과는 JSON 배열로 반환해야 합니다.

      각 JSON 객체는 다음 형식을 따라야 합니다:
      {
        "id": ${id}, //id부터 시작해서 순서대로 부여
        "type": "개발",
        "title": "업무내용 전체 또는 요약",
        "status": 1, // "대기 업무"는 1 "해야할 일"은 2, "진행 중"은 3, "완료"는 4
        "statusName": "보고서에 적힌 업무상태",
        "color": "infoColor", // status 1이면 "infoColor", 2면 "warningColor", 3이면 "infoColorSuppl" 4이면 "successColor"
        "progress": 0, // 상태에 따라 0 ~ 100
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "content": "<ul><li>번호 항목들을 HTML 리스트로 표현</li></ul>"
      }


      📌 예시 응답:
      [
        {
          "id": 13,
          "type": "개발",
          "title": "아마다 웰드 테크코리아 그룹웨어 구축",
          "status": 3,
          "statusName": "완료",
          "color": "successColor",
          "progress": 100,
          "startDate": "2025-06-05",
          "endDate": "2025-07-01",
          "content": "<ul><li>전자결재 12종 개발 완료</li><li>비즈플레이 SSO 연동 개발 완료</li><li>pms SSO 연동 개발 완료</li></ul>"
        },
      ]
      
      ⚠️ 반드시 JSON만 출력해 주세요. 설명이나 머리말 없이 JSON 배열만 출력해야 합니다.

      보고서 목록:
      ${reportsText}
      `.trim();

    const prompt = [{ role: "user", content: fullPrompt }];
    
    startProgressAnimation()
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

      aiResult.value[aiResult.value.length - 1].content = chatResult;
      aiResult.value[aiResult.value.length - 1] = JSON.parse(JSON.stringify(aiResult.value[aiResult.value.length - 1]));

      await nextTick();
    }    
    
    localShow.value = false;
    chatResult = cleanClaudeResponse(chatResult);
    const resultArray = JSON.parse(JSON.stringify(chatResult));
    works.push(...resultArray); // 기존 업무에 덧붙이기
  } catch (e) {
    console.error("AI 요청 중 오류 발생:", e);
  } finally {
    stopProgressAnimation()
    isDisabled.value = false
  }
}


// 파일 선택 시 동작
const handleFileChange = async ({ file, fileList: newFileList }) => {
  fileList.value = newFileList;

  for (const uploadFile of newFileList) {
    const selected = uploadFile.file;
    const ext = selected?.name.split('.').pop()?.toLowerCase();

    if (!selected) continue;

    const text = await readFileAsText(selected);
    let parsed = '';

    if (ext === 'txt') {
      parsed = text;
    } else if (ext === 'eml') {
      parsed = extractPlainTextFromEml(text);
    } else {
      parsed = '지원하지 않는 파일 형식입니다.';
    }

    // 중복 방지: 이미 처리한 파일은 건너뛴다
    if (!worksFile.value.includes(parsed)) {
      worksFile.value.push(parsed);
    }
  }

  updateMode.value = true;
}

const readFileAsText = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
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

/**
 * .eml 파일에서 text/plain 본문을 Base64 디코딩하여 추출
 */
const extractPlainTextFromEml = function(emlRaw) {
  const base64Text = extractBase64PlainText(emlRaw);
  if (!base64Text) return '[본문 없음 또는 base64 추출 실패]';
  return decodeBase64ToUtf8(base64Text);
}

/**
 * base64 텍스트만 추출 (text/plain 파트)
 */
const extractBase64PlainText = function(emlRaw){
  const match = emlRaw.match(
    /Content-Type:\s*text\/plain;[\s\S]*?Content-Transfer-Encoding:\s*base64[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n-{2,}|$)/i
  );
  return match?.[1]?.trim() ?? null;
}

/**
 * base64 → UTF-8 문자열
 */
const decodeBase64ToUtf8 = function(base64) {
  try {
    const binary = atob(base64.replace(/\s/g, ''));
    const bytes = new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return '[Base64 디코딩 실패]';
  }
}

const handleDownload = function(file) {
}

const handleUploadFinish = function({ file }) {
  emit('fileUploaded', file)
}


watch(() => props.show, (val) => (localShow.value = val))
watch(localShow, (val) => {
  if (!val) emit('close')
})
</script>
