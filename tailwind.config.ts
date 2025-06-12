import tailwindcss from 'tailwindcss';
import type { Config } from 'tailwindcss';
import lineClamp from '@tailwindcss/line-clamp'

export default <Config>{
  content: [
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}'
  ],
  safelist: [
    'bg-purple-100','text-purple-700','bg-purple-400',
    'bg-teal-100','text-teal-700','bg-teal-400',
    'bg-blue-100','text-blue-700','bg-blue-400',
    'bg-green-100','text-green-700','bg-green-400'
    // 더 많은 색상 추가 가능
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