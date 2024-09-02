/// <reference types="@sveltejs/kit" />

declare module 'highlightjs-svelte';

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onclickoutside: () => void
  }
}

declare module 'svelte-grid';
declare module 'svelte-grid/build/helper/index.mjs';

declare module '*.svelte' {
  export { SvelteComponentDev as default } from 'svelte/internal';
}