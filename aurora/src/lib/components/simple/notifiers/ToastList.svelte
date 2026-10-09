<script lang="ts">
	import './Toaster.css';
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import Toast from './Toast.svelte';
	import { closeToast, pauseToasts, resumeToasts, toaster } from './toasts.svelte.js';

	interface Props {
		base?: boolean;
	}

	let { base = false }: Props = $props();

	const outlet = Symbol();
	let container = $state<HTMLDivElement>();
	let announcements = $state<{ key: number; text: string; assertive: boolean }[]>([]);
	let announced = new Map<number, string>();
	let announcementKey = 0;
	let seeded = false;

	let top = $derived(toaster.outlets.at(-1) === outlet);
	let config = $derived(toaster.config);

	$effect(() => {
		untrack(() => {
			if (base) toaster.outlets.unshift(outlet);
			else toaster.outlets.push(outlet);
		});
		return () => {
			untrack(() => {
				const index = toaster.outlets.indexOf(outlet);
				if (index !== -1) toaster.outlets.splice(index, 1);
			});
			resumeToasts('hover');
			resumeToasts('focus');
		};
	});

	$effect(() => {
		const node = container;
		if (!node || !top) return;
		if (!node.matches(':popover-open')) node.showPopover();
		return () => {
			if (node.matches(':popover-open')) node.hidePopover();
		};
	});

	$effect(() => {
		if (!top) {
			seeded = false;
			return;
		}
		const current = new Set<number>();
		for (const toast of toaster.items) {
			current.add(toast.id);
			const text = [toast.title, toast.description].filter(Boolean).join('. ');
			if (announced.get(toast.id) === text) continue;
			const fresh = !announced.has(toast.id);
			announced.set(toast.id, text);
			if (!seeded || !text) continue;
			untrack(() => announce(text, toast.variant === 'error' || toast.variant === 'warning'));
			if (fresh && container?.matches(':popover-open')) {
				container.hidePopover();
				container.showPopover();
			}
		}
		for (const id of announced.keys()) if (!current.has(id)) announced.delete(id);
		seeded = true;
	});

	function announce(text: string, assertive: boolean) {
		const key = announcementKey++;
		announcements.push({ key, text, assertive });
		setTimeout(() => {
			announcements = announcements.filter((item) => item.key !== key);
		}, 7000);
	}

	function duration(node: Element) {
		const raw = getComputedStyle(node).getPropertyValue('--_duration').trim();
		const value = parseFloat(raw) || 0;
		return raw.endsWith('ms') ? value : value * 1000;
	}

	function slide(node: HTMLElement) {
		const [vertical, horizontal] = config.position.split('-');
		const rtl = getComputedStyle(node).direction === 'rtl';
		const side = horizontal === 'end' ? 1 : horizontal === 'start' ? -1 : 0;
		const x = side * (rtl ? -1 : 1) * (node.offsetWidth + 24);
		const y = side === 0 ? (vertical === 'top' ? -1 : 1) * (node.offsetHeight + 16) : 0;
		return {
			duration: duration(node),
			easing: cubicOut,
			css: (t: number) =>
				`opacity: ${t}; transform: translate(${(1 - t) * x}px, ${(1 - t) * y}px);`
		};
	}

	function onPointerLeave(event: PointerEvent) {
		if (!(event.relatedTarget instanceof Node && container?.contains(event.relatedTarget)))
			resumeToasts('hover');
	}

	function onFocusOut(event: FocusEvent) {
		if (!(event.relatedTarget instanceof Node && container?.contains(event.relatedTarget)))
			resumeToasts('focus');
	}
</script>

{#if top}
	<div class="aurora-toaster-live" role="status">
		{#each announcements.filter((item) => !item.assertive) as item (item.key)}<p>{item.text}</p>{/each}
	</div>
	<div class="aurora-toaster-live" role="alert">
		{#each announcements.filter((item) => item.assertive) as item (item.key)}<p>{item.text}</p>{/each}
	</div>
	<div
		bind:this={container}
		popover="manual"
		class={['aurora-toaster', config.className]}
		data-position={config.position}
		role={toaster.items.length ? 'region' : undefined}
		aria-label={toaster.items.length ? config.label : undefined}
		onfocusin={() => pauseToasts('focus')}
		onfocusout={onFocusOut}
	>
		{#each toaster.items as toast (toast.id)}
			<div
				class="aurora-toaster-item"
				role="presentation"
				onpointerenter={() => pauseToasts('hover')}
				onpointerleave={onPointerLeave}
				animate:flip={{ duration: container ? duration(container) : 0 }}
				in:slide
				out:slide
			>
				{#if config.toastSnippet}
					{@render config.toastSnippet({ toast, close: () => closeToast(toast.id, 'dismiss') })}
				{:else}
					<Toast {toast} closeLabel={config.closeLabel} />
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		.aurora-toaster {
			--_offset: var(--toast-offset, var(--toast-default-offset));
			--_duration: var(--toast-duration, var(--toast-default-duration));

			position: fixed;
			inset: auto;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			gap: var(--toast-gap, var(--toast-default-gap));
			width: var(--toast-width, var(--toast-default-width));
			max-width: calc(100vw - 2 * var(--_offset));
			margin: 0;
			padding: 0;
			overflow: visible;
			border: 0;
			background: transparent;
			color: inherit;
			pointer-events: none;
		}

		.aurora-toaster[data-position^='top'] {
			top: var(--_offset);
			flex-direction: column-reverse;
		}

		.aurora-toaster[data-position^='bottom'] {
			bottom: var(--_offset);
		}

		.aurora-toaster[data-position$='-end'] {
			inset-inline-end: var(--_offset);
		}

		.aurora-toaster[data-position$='-start'] {
			inset-inline-start: var(--_offset);
		}

		.aurora-toaster[data-position$='-center'] {
			left: 50%;
			translate: -50% 0;
		}

		@media (max-width: 640px) {
			.aurora-toaster {
				inset-inline: var(--_offset);
				width: auto;
				max-width: none;
				translate: none;
			}

			.aurora-toaster[data-position$='-center'] {
				translate: none;
			}
		}

		.aurora-toaster-item {
			pointer-events: auto;
		}

		.aurora-toaster-live {
			position: fixed;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}
</style>
