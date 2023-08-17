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
    resolve: {
        alias: [
            {
                find: 'minister',
                replacement: resolvePkgPath('minister'),
            },

            {
                find: '@minister/sandbox-iframe',
                replacement: resolvePkgPath('sandbox-iframe'),
            },
            {
                find: '@minister/sandbox',
                replacement: resolvePkgPath('sandbox'),
            },
        ],
    },
});
