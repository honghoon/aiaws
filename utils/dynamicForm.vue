<template>
  <n-card
    size="medium"
    class="w-full max-w-5xl mx-auto rounded-2xl shadow-md border border-gray-200 bg-white"
    content-style="padding: 2rem;"
  >
    <!-- 제목 -->
    <h3 class="text-lg font-bold text-slate-500 mb-6 border-b pb-2">
      {{ title }}
    </h3>

    <!-- 폼 영역 -->
    <n-form
      :model="localModel"
      label-placement="left"
      :label-width="100"
      class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
    >
      <n-form-item
        v-for="(field, index) in schema"
        :key="index"
        :label="field.label"
        :path="field.key"
        class="w-full"
      >
        <component
          :is="resolveComponent(field)"
          v-model:value="localModel[field.key]"
          v-bind="getComponentProps(field)"
          class="transition duration-150 ease-in-out focus-within:ring-2 focus-within:ring-blue-400"
        />
      </n-form-item>

      <!-- 버튼 영역 -->
      <div class="md:col-span-2 pt-4 flex justify-end border-t mt-4">
        <n-button type="primary" size="large" @click="onSubmit">
          제출
        </n-button>
      </div>
    </n-form>
  </n-card>
</template>


<script setup>
import { computed } from "vue";
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NButton,
} from "naive-ui";

const props = defineProps({
  schema: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    default: "테이블 제목",
  },
});

const emit = defineEmits(["update:modelValue"]);

// ✅ localModel은 props.modelValue를 Proxy처럼 감싸 사용
const localModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// ✅ 타입별 컴포넌트 결정
const resolveComponent = (field) => {
  switch (field.type) {
    case "text":
      return NInput;
    case "number":
      return NInputNumber;
    case "select":
      return NSelect;
    default:
      return NInput;
  }
};

// ✅ 공통 props 설정
const getComponentProps = (field) => {
  const props = {
    placeholder: field.label,
    class: "w-full",
  };
  if (field.type === "select") {
    props.options = field.options || [];
    props.clearable = true;
  }
  return props;
};

const onSubmit = () => {
  console.log("✅ 제출된 데이터:", JSON.stringify(localModel.value, null, 2));
};
</script>
