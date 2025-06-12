import tailwindcss from 'tailwindcss';
import type { Config } from 'tailwindcss';

export default <Config>{
  theme: {
    extend: {
        fontFamily: {
          'sans': ['Noto Sans KR', 'sans-serif'],
        }
    },
  },
  corePlugins: {
    preflight: false, // 🚀 Preflight를 비활성화하여 기본 스타일을 제거 
  }
};