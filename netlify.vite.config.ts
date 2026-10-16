import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import {resolve} from 'node:path';
export default defineConfig({root:'netlify-web',plugins:[react()],resolve:{alias:{'@':resolve(import.meta.dirname,'.')}},build:{target:'es2020',outDir:'../dist-netlify',emptyOutDir:true},publicDir:'../public'});
