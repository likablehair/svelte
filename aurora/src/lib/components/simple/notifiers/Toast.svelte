<script lang="ts">
	import AlertBanner from './AlertBanner.svelte';
	import Button from '../buttons/Button.svelte';
	import CircularLoader from '../loaders/CircularLoader.svelte';
	import ProgressBar from '../progress/ProgressBar.svelte';
	import { closeToast, type Toast } from './toasts.svelte.js';

	interface Props {
		toast: Toast;
		closeLabel: string;
	}

	let { toast, closeLabel }: Props = $props();

	let extra = $derived(!!toast.description || !!toast.loading || toast.progress !== undefined);

	function act(event: MouseEvent) {
		toast.action?.onclick?.(event);
		if (!event.defaultPrevented) closeToast(toast.id, 'action');
	}
</script>

{#snippet spinner()}
	<CircularLoader label="" --circular-loader-size="16px" --circular-loader-color="currentColor" />
{/snippet}

{#snippet details()}{#if toast.description}{toast.description}{/if}{#if toast.loading}<span
			class="aurora-toast-progress"
			><ProgressBar
				indeterminate
				aria-label={toast.title ?? 'Loading'}
				--progress-bar-height="3px"
			/></span
		>{:else if toast.progress !== undefined}<span class="aurora-toast-progress"
			><ProgressBar
				value={toast.progress}
				aria-label={toast.title ?? 'Progress'}
				--progress-bar-height="4px"
			/></span
		>{/if}{/snippet}

{#snippet action()}
	<Button variant="secondary" size="sm" onclick={act}>{toast.action?.label}</Button>
{/snippet}

<AlertBanner
	class={{ container: 'aurora-toast' }}
	role="group"
	aria-label={toast.title}
	variant={toast.variant}
	title={toast.title}
	icon={toast.icon}
	closable={toast.closable ?? true}
	{closeLabel}
	onclose={() => closeToast(toast.id, 'dismiss')}
	iconSnippet={toast.loading ? spinner : undefined}
	descriptionSnippet={extra ? details : undefined}
	appendSnippet={toast.action ? action : undefined}
/>

<style>
	@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;

	@layer global.components {
		:global(.aurora-toast) {
			--alert-banner-background: var(--toast-background, var(--toast-default-background));
			--alert-banner-border-color: var(--toast-border-color, var(--toast-default-border-color));
			--alert-banner-border-radius: var(--toast-border-radius, var(--toast-default-border-radius));
			--alert-banner-box-shadow: var(--toast-box-shadow, var(--toast-default-box-shadow));
			--alert-banner-padding: var(--toast-padding, var(--toast-default-padding));
		}

		.aurora-toast-progress {
			display: block;
			margin-top: 8px;
			white-space: normal;
		}
	}
</style>
