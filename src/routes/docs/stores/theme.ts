import { BROWSER } from 'esm-env';
import { writable } from "svelte/store";

const store = writable<'light' | 'dark'>('light')
export default store

store.subscribe((theme) => {
})