<template>
  <div class="p-8 text-center">
    <h1 class="text-2xl font-semibold text-green-500">About 페이지</h1>
    <n-button class="mt-4" @click="router.push('/')">홈으로</n-button>
  </div>
</template>

<script setup>
const router = useRouter()
import { NButton } from 'naive-ui'
</script>