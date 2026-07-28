import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // main 빌드와 출력명이 겹치지 않도록 고정한다.
        // main.ts의 path.join(__dirname, 'preload.js')와 짝을 이룬다.
        entryFileNames: 'preload.js',
      },
    },
  },
});
