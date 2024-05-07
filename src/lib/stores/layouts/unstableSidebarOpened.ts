import { writable } from "svelte/store";

export let sidebarOpened = writable<boolean>(false);