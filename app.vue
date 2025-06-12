<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-global-style />
      <n-loading-bar-provider>
        <n-notification-provider>
          <n-modal-provider>
            <n-message-provider>
              <NuxtLayout>
                  <NuxtPage />
              </NuxtLayout>
            </n-message-provider>
          </n-modal-provider>
        </n-notification-provider>
      </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup>
import '@/assets/css/main.css'
import { darkTheme } from 'naive-ui'
import { useThemeVars } from 'naive-ui';

const theme = ref(null)
const themeVars = useThemeVars();

/** 기본 테마 변경 방법 */
themeVars.value.fontFamily = "Noto Sans KR, sans-serif"
themeVars.value.fontSize = "14px"
// themeVars.value.textColorBase = "red"
themeVars.value.textColor1 = "#334155"
themeVars.value.textColor2 = "#334155"

const themeOverrides = {
    common: {
      // primaryColor: '#FF0000'
      // fontWeight: "900",
      fontFamily: "Noto Sans KR, sans-serif"
    }
  }

</script>