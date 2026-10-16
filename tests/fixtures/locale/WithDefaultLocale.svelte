<script lang="ts">
	import type { Component } from 'svelte';
	import { setDefaultLocale } from '#lib/utils/locale.js';

	interface Props {
		locale: string | undefined;
		component: Component<any, any, any>;
		componentProps?: Record<string, unknown>;
	}

	let { locale, component: Child, componentProps = {} }: Props = $props();

	setDefaultLocale(() => locale);
</script>

<Child {...componentProps} />
