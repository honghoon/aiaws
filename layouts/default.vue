<template>
  <div style="position: relative" class="h-screen">
      <n-layout position="absolute" v-show="isReady">
          <n-layout-header
              class="bg-blue-600 text-white h-[40px] flex items-center"
          >
              <nav>
                    <div class="flex items-center gap-3">
                        <n-button
                            quaternary
                            size="large"
                            class="mr-3"
                            @click="collapsed = !collapsed"
                        >
                            <template #icon>
                                <n-icon><MenuSharp /></n-icon>
                            </template>
                        </n-button>
                        <img :src="logo" alt="AIW Logo" class="h-[30px] ml-3"/>
                    </div>
              </nav>
          </n-layout-header>
          <n-layout
              has-sider
              position="absolute"
              style="top: 40px; bottom: 33px"
          >
              <n-layout has-sider>
                  <n-layout-sider
                      bordered
                      collapse-mode="width"
                      :collapsed-width="64"
                      :width="240"
                      :collapsed="collapsed"
                      show-trigger
                      @collapse="collapsed = true"
                      @expand="collapsed = false"
                  >
                      <n-menu
                          :collapsed-width="64"
                          :collapsed-icon-size="22"
                          :options.value="transformedMenuOptions"
                           @update:value="handleMenuClick"
                      />
                  </n-layout-sider>
                  <n-layout class="flex-1 overflow-auto min-h-0" content-style="background-color: #f1f4f9;">
                      <NuxtPage/>
                  </n-layout>
              </n-layout>
          </n-layout>
          <!-- <n-layout-footer
              bordered
              position="absolute"
              class="bg-gray-800 text-white p-4 text-center h-[10px] flex items-center"
          >
              ⓒ 2024 My Nuxt App
          </n-layout-footer> -->
      </n-layout>
  </div>
</template>

<script setup>
import { MenuSharp} from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';
import { defineComponent, h, ref } from 'vue';
import { useRouter } from "vue-router";
import logo from '@/assets/images/aiw_logo_clean.svg'

const router = useRouter(); 

const isReady = ref(false);

const transformedMenuOptions = ref([]);

async function loadIcon(iconName) {
  try {
      const iconModule = await import('@vicons/ionicons5'); // ✅ 필요할 때만 동적 import
      return iconModule[iconName] || null; // ✅ 아이콘이 없으면 null 반환
  } catch (error) {
      console.error(`아이콘 "${iconName}"을 찾을 수 없습니다.`);
      return null;
  }
}

// ✅ 아이콘을 렌더링하는 함수
async function renderIcon(iconName) {
  const iconComponent = await loadIcon(iconName);
  if (!iconComponent) return null;
  return () => h(NIcon, null, { default: () => h(iconComponent) });
}

const collapsed = ref(true);

const menuOptions = [
  {
      label: '주간보고',
      key: 'hear-the-wind-sing',
      icon: 'LayersOutline',
      to: '/weeklyReport',
  },
  {
      label: '할일',
      key: 'KanbanBoard',
      icon: 'NewspaperOutline',
      to: '/KanbanBoard',
  },
  {
      label: 'ERP',
      key: 'about',
      icon: 'NewspaperOutline',
      to: '/about',
  }
];

const transMenuoption = async () => {
  // transformedMenuOptions.value = menuOptions;
  for (const item of menuOptions) {
      const transformedItem = { 
          ...item,
          icon: item.icon ? await renderIcon(item.icon) : undefined,
      };

      if (item && item.children) {
          transformedItem.children = [];
          for (const child of item.children) {
              transformedItem.children.push({
                  ...child,
                  icon: child.icon ? await renderIcon(child.icon) : undefined
              });
          }
      }

      transformedMenuOptions.value.push(transformedItem); // ✅ 하나씩 푸시하여 Proxy 문제 방지
  }
  
  console.log("transformedMenuOptions", transformedMenuOptions.value);
};

const handleMenuClick = (key) => {
const selectedItem = menuOptions.find((item) => item.key === key);

if (selectedItem && selectedItem.to) {
  // activeKey.value = key; // ✅ 활성화된 메뉴 업데이트
  router.push(selectedItem.to); // ✅ 페이지 이동
} else {
  console.warn("No route found for key:", key);
}
};

onMounted(async () => {
  isReady.value = true; // ✅ 렌더링이 완료된 후 UI를 표시
  await transMenuoption();
});
</script>

<style>
/* @tailwind base;
@tailwind components;
@tailwind utilities; */
</style>