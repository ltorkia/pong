// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: true,
//     port: 5173,
//     // port: 3000,
//     proxy: {
//       '/api': 'http://backend:3000'
//     }
//   }
// });

// import { defineConfig } from 'vite';

// export default defineConfig({
//   server: {
//       // host: true, //equiv 0.0.0.0
//       // port: 8080,
//     proxy: {
//       '/api': {
//         target: 'http://backend:3000',
//         changeOrigin: true,
//         rewrite: path => path,
//       },
//     },
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8080', // ⚠️ utilise le nom du service docker
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
