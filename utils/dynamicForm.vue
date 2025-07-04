<template>
  <n-card
    size="medium"
    class="w-full max-w-5xl mx-auto rounded-2xl shadow-md border border-gray-200 bg-white"
    content-style="padding: 2rem;"
  >
    <h3 class="text-lg font-bold text-slate-500 mb-6 border-b pb-2">
      {{ title }}
    </h3>

    <!-- ✅ 보기 모드 -->
    <div v-if="isViewMode" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="(field, index) in schema"
        :key="index"
        :class="getColSpanClass(field)"
      >
        <div class="text-sm text-slate-500 font-semibold mb-1">
          {{ field.label }}
        </div>
        <div class="text-base text-slate-700">
          {{ formatValue(field, localModel[field.key]) }}
        </div>
      </div>

      <!-- ✅ 보기 모드: lineItemSections가 존재할 때 추가 렌더링 -->
      <div v-if="isViewMode && lineItemSections?.length" class="space-y-6 mt-8 md:col-span-3">
        <div
          v-for="(section, sIndex) in lineItemSections"
          :key="'section-' + sIndex"
          class="border-t pt-6"
        >
          <h4 class="text-base font-bold text-slate-600 mb-2">
            {{ section.title }}
          </h4>
          <n-data-table
            :columns="section.columns"
            :data="localModel[section.key] || []"
            :bordered="true"
            :scroll-x="1000"
          />
        </div>
      </div>

      <div class="md:col-span-3 pt-4 flex justify-end border-t mt-4">
        <n-button type="default" @click="isViewMode = false">
          수정하기
        </n-button>
      </div>
    </div>

    <!-- ✅ 수정 모드 -->
    <n-form
      v-if="isViewMode == false"
      ref="formRef"
      :model="localModel"
      :rules="formRules"
      label-placement="left"
      :label-width="100"
      class="grid grid-cols-1 md:grid-cols-3 gap-0"
    >
      <n-form-item
        v-for="(field, index) in schema"
        :key="index"
        :label="field.label"
        :path="field.key"
        :class="getColSpanClass(field)"
      >
        <template v-if="field.edit === false">
          <div class="text-sm text-slate-600 font-normal">
            {{ formatValue(field, localModel[field.key]) }}
          </div>
        </template>
        <component
          v-else
          :is="resolveComponent(field)"
          v-model:value="localModel[field.key]"
          v-bind="getComponentProps(field)"
          class="w-full"
        />
      </n-form-item>

      <!-- ✅ 보기 모드: lineItemSections가 존재할 때 추가 렌더링 -->
      <div v-if="isViewMode == false && lineItemSections?.length" class="md:col-span-3 space-y-6 mt-8">
        
        
        
        <div
          v-for="(section, sIndex) in lineItemSections"
          :key="'section-' + sIndex"
          class="pt-0"
        >

          <div class="pt-4 flex justify-between border-t mt-0 mb-0">
            <h4 class="text-base font-bold text-slate-600 mb-2">
                {{ section.title }}
              </h4>

            <n-button strong secondary type="primary" size="small" >
              추가
            </n-button>
          </div>

          <n-data-table
            :columns="section.columns"
            :data="localModel[section.key] || []"
            :bordered="true"
            :scroll-x="1000"
          />
        </div>
      </div>


      <div class="md:col-span-3 pt-4 flex justify-end border-t mt-4">
        <n-button type="primary" size="large" @click="onSubmit">
          제출
        </n-button>
      </div>
    </n-form>
  </n-card>
</template>


<script setup>
import { computed, ref } from 'vue'
import {
  NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, useMessage, NDatePicker, NDataTable
} from 'naive-ui'

const message = useMessage()

const props = defineProps({
  title: String,
  schema: Array,
  modelValue: Object,
  lineItemSections: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['update:modelValue'])

const formRef = ref(null)
const isViewMode = ref(true)

const localModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const resolveComponent = (field) => {
  if (field.edit === false) {
    return {
      props: ['value'],
      setup(props) {
        return () => h('div', props.value ?? '')
      }
    }
  }

  switch (field.type) {
    case 'text': return NInput
    case 'number': return NInputNumber
    case 'select': return NSelect
    case 'textarea': return NInput
    case 'date': return NDatePicker
    default: return NInput
  }
}

const getComponentProps = (field) => {
  const props = {
    placeholder: field.placeholder || field.label
  }
  if (field.type === 'textarea') props.type = 'textarea'
  if (field.type === 'select') {
    props.options = field.options || []
    props.clearable = true
  }
  if (field.type === 'date') {
    props.type = 'date'
    props.clearable = true
    props.format = 'yyyy-MM-dd'
    props.valueFormat = 'timestamp' // Unix timestamp (ms)
  }
  return props
}

const getColSpanClass = (field) => {
  const colSpan = field.colSpan || 1
  return `w-full col-span-1 md:col-span-${colSpan}`
}

const formatValue = (field, value) => {
  if (field.type === 'select' && field.options) {
    const found = field.options.find(opt => opt.value === value)
    return found ? found.label : value
  }
  if (field.type === 'date') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
  }
  if (field.dataType === 'amount' && typeof value === 'number') {
    return value.toLocaleString(); // 세 자리 콤마 포맷
  }
  return value ?? '-'
}

const formRules = computed(() => {
  const rules = {}
  props.schema.forEach(field => {
    const fieldRules = []

    if (field.type === 'number') {
      fieldRules.push({
        validator: (_, value) => {
          if (value === '' || value === null || value === undefined) {
            return Promise.reject(`${field.label}을(를) 입력해주세요.`)
          }
          if (isNaN(Number(value))) {
            return Promise.reject(`${field.label}은 숫자여야 합니다.`)
          }
          if (field.min != null && value < field.min) {
            return Promise.reject(`${field.label}은 최소 ${field.min} 이상이어야 합니다.`)
          }
          if (field.max != null && value > field.max) {
            return Promise.reject(`${field.label}은 최대 ${field.max} 이하여야 합니다.`)
          }
          return Promise.resolve()
        },
        trigger: ['blur', 'change']
      })
    }

    if (field.type === 'text') {
      if (field.required) {
        fieldRules.push({
          required: true,
          message: `${field.label}을(를) 입력해주세요.`,
          trigger: ['blur', 'change']
        })
      }
      if (field.minLength) {
        fieldRules.push({
          min: field.minLength,
          message: `${field.label}은 최소 ${field.minLength}자 이상 입력해주세요.`,
          trigger: 'blur'
        })
      }
      if (field.maxLength) {
        fieldRules.push({
          max: field.maxLength,
          message: `${field.label}은 최대 ${field.maxLength}자까지 입력 가능합니다.`,
          trigger: 'blur'
        })
      }
      if (field.pattern) {
        fieldRules.push({
          pattern: field.pattern,
          message: `${field.label}의 형식이 올바르지 않습니다.`,
          trigger: ['blur', 'change']
        })
      }
    }

    if (field.type === 'select') {
      if (field.required) {
        fieldRules.push({
          required: true,
          message: `${field.label}을(를) 선택해주세요.`,
          trigger: ['blur', 'change']
        })
      }
    }

    rules[field.key] = fieldRules
  })
  return rules
})

const onSubmit = async () => {
  try {
    await formRef.value?.validate()
    message.success('제출이 완료되었습니다.')
    isViewMode.value = true
  } catch (err) {
    console.warn('❌ 유효성 실패:', err)
  }
}

</script>
