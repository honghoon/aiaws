<template>
  <div>
    <header>Header</header>
    <NuxtPage /> <!-- 꼭 있어야 함 -->
    <footer>Footer</footer>
  </div>
</template>

<template>
  <n-space vertical>
    <n-modal v-model:show="aiAuthstore.showLoginPopup" :mask-closable="false" v-if="aiAuthstore.showLoginPopup">
      <n-card
        style="width: 600px"
        title="로그인이 필요합니다."
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <!-- <template #header-extra>
          Oops!
        </template> -->
        
        <div class="flex flex-1 flex-col justify-center py-12 px-6">
          <div class="mx-auto w-full max-w-sm lg:w-96">
            <div class="flex justify-center">
              <img class="h-10 w-auto" src="@/assets/images/logoWorkthrough.png" alt="Your Company" />
            </div>
    
            <div class="mt-10">
              <div>
                <form action="#" method="POST" class="space-y-6">
                  <div>
                    <label for="email" class="block text-sm/6 font-semibold text-slate-600">전자메일 주소</label>
                    <n-input class="mt-2" v-model:value="login_mail" type="text" placeholder="email" size="large"/>
                  </div>
    
                  <div>
                    <label for="password" class="block text-sm/6 font-semibold text-slate-600">비밀번호</label>
                    <n-input
                      class="mt-2"
                      type="password"
                      show-password-on="mousedown"
                      placeholder="Password"
                      :maxlength="255"
                      size="large"
                      v-model:value="login_pw"
                      @keydown.enter="login"
                    />
                  </div>
    
                  <!-- <div class="flex items-center justify-between">
                    <div class="flex gap-3 text-slate-600">
                      <n-checkbox v-model:checked="login_re">
                        기억하기
                      </n-checkbox>
                    </div>
    
                    <div class="text-sm/6">
                      <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">비밀번호 찾기</a>
                    </div>
                  </div> -->
                </form>
              </div>
    
              <div class="mt-10 flex justify-between gap-3">
                <n-button class="flex-1 rounded-md" type="info" @click="login" :loading=loading>
                  <template #icon>
                    <n-icon><LogInIcon /></n-icon>
                  </template>
                  <p class="font-bold">로그인</p>
                </n-button>

                <n-button class="flex-1 rounded-md" :loading=loading>
                  <template #icon>
                    <n-icon><ShieldCheckmarkOutline /></n-icon>
                  </template>
                  <p class="font-bold">SSO</p>
                </n-button>
              </div>
            </div>
          </div>
        </div>

        <!-- ddd : {{ aiAuthstore.showLoginPopup }} -->
        <!-- <template #footer>
          Footer
        </template> -->
      </n-card>
    </n-modal>

    <!-- <n-switch v-model:value="collapsed" /> -->
    <n-layout has-sider class="h-screen">
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
        class="h-full"
      >
        <n-menu
          v-model:value="activeKey"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="aiAuthstore.menuList"
          class="font-semibold mt-10"
          @update:value="handleMenuClick"
          :theme-overrides="{
            itemTextColor: '#475569',  // slate-600
            itemTextColorHover: '#1e293b', // slate-800 (호버 시)
            itemTextColorActive: '#1e293b' // 활성화된 항목
          }"
        />
      </n-layout-sider>
      <n-layout class="h-screen flex flex-col">
        <n-layout-header class="fixed top-0 left-0 right-0 h-[50px] bg-white p-4 flex items-center justify-between border-b border-slate-300 z-20 shadow-sm">
          <n-button quaternary>
            <template #icon>
              <n-icon size="30" :depth="2" :component="MenuOutline" @click="toggleSidebar"/>
            </template>
          </n-button>
          <div class="text-xl font-bold text-slate-800"> AI Admin</div>
          <div class="flex items-center space-x-4 mr-3">
            <n-popover trigger="click">
              <template #trigger>
                <n-button text class="text-slate-500 hover:text-slate-800">
                  <n-icon size="25"><SettingsOutline /></n-icon>
                </n-button>
              </template>
              <div class="flex flex-col gap-3">
                <span>{{ aiAuthstore?.userInfo?.user_name }} ({{ aiAuthstore?.userInfo?.mail }})</span>
                <div class="flex items-center cursor-pointer gap-1.5" @click="logout">
                  <span>로그아웃</span>
                </div>
              </div>
            </n-popover>

            
            <!-- <n-button text class="text-slate-500 hover:text-slate-800" @click="logout">
              <n-icon size="25"><LogOutOutline /></n-icon>
            </n-button> -->
          </div>
        </n-layout-header>
        <n-layout-content class="flex-grow bg-[#ebeff2] p-3 !overflow-auto mt-9 h-[calc(100vh-50px)]">
          <Suspense>
            <template #default>
              <NuxtPage /> 
            </template>
            <template #fallback>
              <div class="text-center text-gray-500">Loading...</div>
            </template>
          </Suspense>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-space>
</template>

<script>
import { defineComponent, h, ref, computed } from "vue";
import { NIcon, useLoadingBar, NLayout, NSpace, NMenu, NSwitch, useMessage  } from "naive-ui";
import { MenuOutline, SettingsOutline, LogOutOutline, ShieldCheckmarkOutline } from "@vicons/ionicons5"
import { useRouter } from "vue-router";
import { useAiAuthStore } from '@/store/aiAuthStore'
import { aiPermission } from '@/api/web/index.js'
import { aiSystems } from '@/api/web/index.js'
import { aiAuthRole } from '@/api/web/index.js'

// 아이콘을 동적으로 가져오는 함수 (ES 모듈 방식)
async function loadIcon(iconName) {
  try {
    const module = await import("@vicons/ionicons5");
    if (module[iconName]) {
      return () => h(NIcon, null, { default: () => h(module[iconName]) });
    } else {
      console.warn(`아이콘을 찾을 수 없습니다: ${iconName}`);
      return null;
    }
  } catch (error) {
    console.warn(`아이콘 로드 실패: ${iconName}`, error);
    return null;
  }
}

// 원본 메뉴 옵션 (아이콘을 문자열로 저장)
let menuOptions = [
  {
    label: "Dashboard",
    key: "/admin/aiDashBoard",
    icon: "BarChartOutline"
  }
];

let userPermissions = ref([])


// 아이콘을 적용한 새로운 메뉴 옵션 생성 (비동기)
async function transformMenuOptions(options) {
  return Promise.all(
    options.map(async (item) => ({
      ...item,
      icon: item.icon ? await loadIcon(item.icon) : undefined,
      children: item.children ? await transformMenuOptions(item.children) : undefined
    }))
  );
}


export default defineComponent({
  components: {
    SettingsOutline, 
    LogOutOutline,
    ShieldCheckmarkOutline
  },
  created() {
    if(!this.aiAuthstore.menuList || this.aiAuthstore.menuList.length == 0){
      this.init();
    }
  },
  setup() {
    const aiAuthstore = useAiAuthStore();
    const activeKey = ref(null);
    const collapsed = ref(true);
    const computedMenuOptions = ref([]);
    const router = useRouter();
    const login_mail = ref("")
    const login_pw = ref("")
    const loading = ref(false)
    const loadingBar = useLoadingBar()
    const message = useMessage()
    const sortParam = ref("\"sortOrder\" ASC") /* 기본 정렬 값 */

    const login = async() =>{
      if (!login_mail.value || !login_pw.value){
        message.error(
          'ID / 비밀번호는 필수입니다.',
          {
            keepAliveOnHover: true
          }
        )

        return
      }

      const param = {
        "user_mail":login_mail.value,
        "user_pw":login_pw.value
      }
      
      loadingBar.start()
      loading.value = true

      const response = await aiPermission.userLogin(param)
        if (response.status == 200) {
          if (response.data.success != 1){
            message.error(
              response.data?.message || "오류가 발생하였습니다. 관리자에게 문의바랍니다.",
                {
                  keepAliveOnHover: true
                }
            )
          }else{
            aiAuthstore.setAiAuthentication(response.data.result.token)
            aiAuthstore.setUserInfo(response.data.result.users)
            aiAuthstore.triggerLoginClose()
          }
        }else{
          message.error(
            'Server 에러가 발생하였습니다. 잠시후 재시도 바랍니다.',
            {
              keepAliveOnHover: true
            }
          )
        }

        loadingBar.finish()
        loading.value = false
    }

    //시스템 메뉴 전체 가져오기
    async function searchMenu() {

      let filtersData = []

      try {

        let param = {
          "filters": filtersData,
          "sort": sortParam.value
        }

        loadingBar.start()
        loading.value = true

        const response = await aiSystems.selectSystems(param)
        if (response.status == 200) {
          menuOptions = response.data.result.data;
        }else{
          message.error(
            'Server 에러가 발생하였습니다. 잠시후 재시도 바랍니다.',
            {
              keepAliveOnHover: true
            }
          )
        }
        
      } catch (error) {    
        message.error(
          'Server 에러가 발생하였습니다. 잠시후 재시도 바랍니다.',
          {
            keepAliveOnHover: true
          }
        )
        console.error(error)
      } finally {
        loadingBar.finish()
        loading.value = false
      }
    }

    //로그인한 사용자의 permission정보 가져오기
    async function selectFindAuthRoles(userInfo) {

      let ids = userInfo?.roles; //로그인한 사용자의 역할정보

      if(!ids){
        message.error(
          '로그인 사용자의 역할정보가 없습니다.',
          {
            keepAliveOnHover: true
          }
        )
      }else{
        try {

          let param = {
            "ids": ids
          }

          loadingBar.start()
          loading.value = true

          const response = await aiAuthRole.selectFindAuthRoles(param)
          if (response.status == 200) {
            if(response.data.success == 1 ){
              let authrolelist = response.data.result.data

              if(authrolelist.length > 0){

                // 모든 permissions 모으고 중복 제거
                const allPermissions = new Set()
                authrolelist.forEach(role => {
                  role.permissions.forEach(permission => {
                    allPermissions.add(permission)
                  })
                })

                // Set을 배열로 변환하여 반영
                userPermissions.value = Array.from(allPermissions)
              }

            }else{        
              message.error(
                'Server 에러가 발생하였습니다. 잠시후 재시도 바랍니다.',
                {
                  keepAliveOnHover: true
                }
              )
            }
            menuOptions = response.data.result.data;
          }else{
            message.error(
              'Server 에러가 발생하였습니다. 잠시후 재시도 바랍니다.',
              {
                keepAliveOnHover: true
              }
            )
          }
          
        } catch (error) {         
          message.error(
            'Server 에러가 발생하였습니다. 잠시후 재시도 바랍니다.',
            {
              keepAliveOnHover: true
            }
          )
          console.error(error)
        } finally {
          loadingBar.finish()
          loading.value = false
        }

      }      
    }

    //로그인 사용자의 permissions에 해당하는 메뉴 정제하기
    function filterMenuByPermissions(menu, allowedPermissions) {
      const filteredMenu = [];

      for (let i = 0; i < menu.length; i++) {
        const item = { ...menu[i] }; // 얕은 복사

        // 부모 permission이 있는 경우 체크
        if (item.permission) {
          if (!allowedPermissions.includes(item.permission)) {
            continue; // 부모가 권한 없으면 건너뜀 (children도 무시)
          }
        }

        // children이 있을 경우 각각 검사
        if (Array.isArray(item.children)) {
          const newChildren = [];

          for (let j = 0; j < item.children.length; j++) {
            const child = item.children[j];

            if (!child.hasOwnProperty("permission") || child.permission === null || child.permission === "") {
              // permission 키가 없거나 값이 null/빈 문자열이면 포함
              newChildren.push(child);
            } else if (allowedPermissions.includes(child.permission)) {
              newChildren.push(child);
            }
          }

          item.children = newChildren;
        }

        filteredMenu.push(item);
      }

      return filteredMenu;
    }

    // setup 안에서 순차 실행
    async function init (){
      //로그인 사용자 역할정보 가져와서 permission Array 만들기
      await selectFindAuthRoles(aiAuthstore.userInfo);
      // DB에서 메뉴 가져오기
      await searchMenu(); 
      //사용자 permission에 맞게 메뉴 정제하기
      const filteredMenu = filterMenuByPermissions(menuOptions, userPermissions.value);
      // 메뉴 옵션 변환 (비동기 적용)
      transformMenuOptions(filteredMenu).then((result) => {
        aiAuthstore.setmenuList(result)
      });
    }

    const handleMenuClick = (key) => {
      console.log("handleMenuClick", key)
      router.push(key);
    };

    // ✅ 사이드바 열고 닫기 함수
    const toggleSidebar = () => {
      collapsed.value = !collapsed.value;
    };

    const logout = async() =>{
      aiAuthstore.setAiAuthentication(null)
      aiAuthstore.setUserInfo(null)
      const response = await aiPermission.logout()
      router.replace("/login")
    }
    return {
      message,
      aiAuthstore,
      activeKey,
      collapsed,
      computedMenuOptions,
      MenuOutline,
      toggleSidebar,
      handleMenuClick,
      SettingsOutline, 
      LogOutOutline,
      ShieldCheckmarkOutline,
      logout,
      login_mail,
      login_pw,
      loading,
      login,
      init
    };
  }
});
</script>

<style>
/* 📌 Tailwind 적용 */
.n-menu-item {
  @apply font-semibold text-slate-500 hover:text-slate-800 transition-all;
}

.router-container {
  background-color: #ebeff2; /* ✅ 배경색 설정 */
  height: calc(100vh - 200px); /* ✅ 화면 전체를 채우도록 설정 */
  width: 100%;
  padding: 20px; /* 여백 추가 (선택 사항) */
}

</style>
