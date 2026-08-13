import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/HIENDT-CBT/',

  /*
   * 빌드마다 바뀌는 값.
   *
   * JS·CSS 는 파일명에 해시가 붙어 배포하면 알아서 새로 받아간다.
   * 그런데 문항 JSON(public/data/…)은 파일명이 고정이라, 브라우저가
   * 예전 것을 계속 들고 있으면 문제를 고쳐 배포해도 옛 문제가 나온다.
   * 주소 뒤에 이 값을 붙여 배포할 때마다 새로 받게 한다.
   */
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },

  plugins: [react()],
})
