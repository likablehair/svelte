import adapterAuto from '@sveltejs/adapter-auto'
import adapterNode from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import svelteDts from 'svelte-dts';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  vitePlugin: [],
  kit: {
    adapter:
      process.env.ADAPTER == 'node' ? adapterNode({ out: 'build' }) : adapterAuto({ out: 'build' }),
  },
}

export default config
