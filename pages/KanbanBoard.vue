<template>
    <div class="relative">
        <div class="min-h-[calc(100vh-75px)] bg-white flex flex-col p-6">
            <div class="flex pb-3 justify-end gap-3">
                <n-button strong secondary round type="primary">
                데이터 불러오기
                </n-button>
                <n-button strong secondary round type="tertiary">
                등록
                </n-button>
                <n-button strong secondary round type="info">
                조회
                </n-button>
            </div>
            <div class="flex gap-4">
                <div v-for="column in columns" :key="column"
                    class="flex-1 bg-slate-100/50 text-md p-4 flex flex-col rounded-md h-[calc(100vh-160px)]" @dragover.prevent
                    @drop="onDrop($event, column)">
                    <h2 class="font-bold mb-4 text-slate-600">{{ column }}</h2>
                    <div class="flex-1 space-y-2 overflow-y-auto">
                        <div v-for="card in cards.filter((c) => c.status === column)" :key="card.id"
                            class="p-3 bg-white shadow rounded-md cursor-move text-md flex flex-col gap-2"
                            draggable="true" @dragstart="onDragStart($event, card.id)">
                            <p class="line-clamp-2 text-slate-600 break-words text-sm font-normal">
                                {{ card.title }}
                            </p>

                            <div class="flex justify-between pt-3 pb-3">
                                <p class="text-sm font-normal text-slate-400">
                                    {{ card.date }}
                                </p>
                                <div class="px-3 h-6 rounded-full text-xs font-semibold flex items-center"
                                    :class="getBadgeClasses(card.type).badge">
                                    <!-- <span class="w-2 h-2 rounded-full mr-1" :class="`bg-${getTypeColor(card.type)}-400 flex-shrink-0`"></span> -->
                                    <span class="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                                        :class="getBadgeClasses(card.type).dot"></span>
                                    <span>
                                        {{ card.type }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <n-float-button position="fixed" bottom="50px" right="24px" menu-trigger="click" v-model:show-menu="showMenu"
            class="z-50 transition overflow-visible">
            <n-icon>
                <text x="12" y="16" text-anchor="middle" font-size="12" fill="currentColor"
                    font-family="Arial, sans-serif">AI</text>
            </n-icon>

            <template #menu>
                <!-- 하단 중앙 고정 입력창 (아이콘 버튼 포함) -->
                <div
                    class="fixed rounded-lg bottom-0 left-1/2 -translate-x-1/2 w-250 bg-white p-4 shadow-xl flex justify-center">
                    <div class="relative w-250">
                        <div class="flex flex-col h-[400px] bg-slate-100/50 rounded-md">sdfsdf</div>
                        <textarea v-model="aiText" rows="2"
                            class="mt-3 w-full resize-none rounded-lg bg-gray-100 px-3 py-2 pr-10 text-sm focus:outline-none"
                            @input="autoResize" placeholder="AI에게 물어보세요..."
                            :style="{ 'max-height': textareaMaxHeight + 'px' }" />

                        <!-- 보내기 버튼 (아이콘) -->
                        <button @click="submitAI"
                            class="absolute bottom-6 right-2 flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded-full hover:bg-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"
                                aria-label="보내기">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </template>
        </n-float-button>
    </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
const showInput = ref(false);
const aiText = ref("");
const textareaMaxHeight = 100; // 약 3줄 정도 최대 높이(px)
// 컬럼 상태
const columns = ["대기 업무", "해야 할 일", "진행 중", "완료"];

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

/** 제출 처리 */
function submitAI() {
    console.log("AI 입력:", aiText.value);
    aiText.value = "";
    showMenu.value = false;
}

// 카드 데이터
const cards = ref([
    {
        id: 1,
        type: "개발",
        title:
            "분석 설계 안녕하세요. 안녕하세요. 제목입니다. .. 으흐흐흐 하나 둘 셋 넷 다섯.. 여섯 . 으흐흐흐 하나 둘 셋 넷 다섯.. 여섯 . 으흐흐흐 하나 둘 셋 넷 다섯.. 여섯 ",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    },
    {
        id: 2,
        type: "개발",
        title: "프론트 개발",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    },
    {
        id: 3,
        type: "업무협의",
        title: "테스트 작성",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    },
    {
        id: 3,
        type: "업무협의",
        title: "테스트 작성",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    },
    {
        id: 3,
        type: "업무협의",
        title: "테스트 작성",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    },
    {
        id: 3,
        type: "업무협의",
        title: "테스트 작성",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    },
    {
        id: 3,
        type: "업무협의",
        title: "테스트 작성",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    },
    {
        id: 3,
        type: "업무협의",
        title: "테스트 작성",
        status: "대기 업무",
        date: "2025-07-01",
        procName: "홍훈",
    }
]);

const getTypeColor = (_type) => {
    return mappings[_type];
};

let draggedId = null;

function onDragStart(e, id) {
    draggedId = id;
    e.dataTransfer.effectAllowed = "move";
}

function onDrop(e, toStatus) {
    const card = cards.value.find((c) => c.id === draggedId);
    if (card) card.status = toStatus;
    draggedId = null;
}
</script>

<style>
/* Tailwind 기반 스타일 외 필요 시 여기에 추가 */
</style>
