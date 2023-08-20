import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePkgPath } from './utils';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        replace({
            __DEV__: true,
            preventAssignment: true,
        }),
    ],
    server: {
        open: true,
    },
    resolve: {
        alias: [
            {
                find: 'minister',
                replacement: resolvePkgPath('minister/src'),
            },

            {
                find: '@minister/sandbox-iframe',
                replacement: resolvePkgPath('sandbox-iframe/src'),
            },
            {
                find: '@minister/sandbox',
                replacement: resolvePkgPath('sandbox-iframe'),
            },
        ],
    },
});
