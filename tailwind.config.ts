import tailwindcss from 'tailwindcss';
import type { Config } from 'tailwindcss';
import lineClamp from '@tailwindcss/line-clamp'

export default <Config>{
  content: [
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
        fontFamily: {
          'sans': ['Noto Sans KR', 'sans-serif'],
        }
    },
  },
  corePlugins: {
    preflight: false, // 🚀 Preflight를 비활성화하여 기본 스타일을 제거 
  },
  plugins: [
    lineClamp
  ],
};