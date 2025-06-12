<template>
  <div class="p-8 text-center">
    <h1 class="text-3xl font-bold text-blue-600">홈 페이지</h1>
    <n-button class="mt-4" @click="navigate">/about로 이동</n-button>
  </div>
</template>

<script setup lang="ts">

  // definePageMeta({
  //     layout: "default", // 기본 레이아웃 적용
  // });

const router = useRouter()
const navigate = () => {
  router.push('/about')
}
</script>