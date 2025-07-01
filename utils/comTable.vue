
<template>
  <n-card size="small" class="Flex rounded-md w-full inline-block min-w-full !max-w-full !overflow-x-auto">
    <n-space vertical class="w-full">
      <div justify="space-between" class="w-full">
        <div class="flex items-center justify-between w-full mb-2">
            <!-- 좌측: 제목 -->
            <h3 class="text-lg font-semibold text-slate-700">{{ tableTitle }}</h3>

            <!-- 우측: 전송 버튼 -->
            <n-button
              v-if="edit === 'edit'"
              type="primary" 
              size="small" 
              strong 
              secondary 
              @click="showModal = true"
            >
              전송
            </n-button>
        </div>
        <n-data-table v-if="init"
          :bordered="true"
          :columns="tableColumns" 
          :data="tableRowData" 
          :pagination="pagination"
          table-layout="fixed"
          :sticky-expanded-rows="true"
          :flex-height="true"
          size="small"
          :scroll-x="tableWidth"
          :style="{ height: '400px' }"
        />
      </div>
    </n-space>
    <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    preset="dialog"
    title="전표상신"
    content="전표를 상신하시겠습니까?"
    positive-text="확인"
    negative-text="취소"
    @positive-click="onPositiveClick(tableRowData)"
    @negative-click="onNegativeClick()"
  />

  </n-card>
</template>

<script setup>
// ✅ 필요한 Vue 기능과 props 정의
import { reactive, watch, onMounted } from 'vue'
import { createColumns } from '~/utils/tableUtils'
import { SendOutline } from '@vicons/ionicons5'

const init = ref(false);

const tableColumns = ref(null)
const tableWidth = ref(0)

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  tableRowData: {
    type: Array,
    required: true
  },
  tableTitle: {
    type: String,
    default: '테이블 제목'
  },
  edit: {
    type: String,
    default: undefined
  }
})



// ✅ 페이지네이션 설정
const pagination = reactive({
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})


// ✅ columns가 들어오면 실행할 함수
function processColumns(columns) {
  console.log('📌 columns 들어옴:', columns)
  // 여기에 컬럼을 기반으로 동적 처리 로직 작성

  if (columns && columns.length === 0) {
    console.warn('❗ columns가 비어 있습니다.')
    init.value = false
    return
  }
  const { columns: _tableColumns, tableWidth: _tableWidth } = createColumns(columns)

// 이제 tableColumns로 사용
  if (_tableColumns && _tableColumns.length > 0) {
    init.value = true
    tableColumns.value = _tableColumns
    tableWidth.value = _tableWidth
  } else {
    init.value = false
  }
}

onMounted(() => {
  if (props.columns && props.columns.length > 0) {
    processColumns(props.columns)
  }
})

// 전송 버튼 호출시 처리
// 테이블에 구성된 데이터를 처리한다.
// 구성된 데이터 외부 API 처리 후 결과 전송받에 화면에 표시
const onClickSend = (tableRowData) => {
  console.log(tableRowData);

  // 데이터를 전달하고 결과를 받아 화면 창에 표시
  alert('test');
  

};

// 결과 모달창 설정
const showModal = ref(false)

const onPositiveClick = (tableRowData) => {
  console.log(tableRowData[0].amount);
  showModal.value = false;

  // 데이터를 전달하고 결과를 받아 화면 창에 표시

};

const onNegativeClick = () => {
  console.log("취소합니다.");
  showModal.value = false;

  // 데이터를 전달하고 결과를 받아 화면 창에 표시

};





</script>
