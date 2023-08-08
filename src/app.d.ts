/// <reference types="@sveltejs/kit" />

declare module 'highlightjs-svelte';

declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onclickoutside: () => void
  }
}