import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 진입점이 src/main/index.ts라 기본 출력명이 index.js가 된다.
        // package.json의 "main"(.vite/build/main.js)에 맞춰 고정한다.
        entryFileNames: 'main.js',
      },
    },
  },
});
