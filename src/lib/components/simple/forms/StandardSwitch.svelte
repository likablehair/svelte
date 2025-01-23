<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import './StandardSwitch.css'

	export let label: string = '',
		value: boolean | undefined = undefined,
		fontSize: number = 16,
		disabled: boolean = false,
		gap: string = '0.5em',
		labelWidth: string = 'auto'

	let checked = value
	const uniqueID = Math.floor(Math.random() * 100)

	function handleClick(event: MouseEvent) {
		const target = (event.target as HTMLElement) || null

		const state = target.getAttribute('aria-checked')
		checked = state === 'true' ? false : true
		value = checked === true ? true : false

		dispatch('change', {
			label: label,
			value: checked
		})
	}

	let dispatch = createEventDispatcher<{
		change: {
			label: string
			value: boolean
		}
	}>()
</script>

<div class="s s--slider" style="font-size:{fontSize}px; gap:{gap}">
	<span style="width: {labelWidth}" id={`switch-${uniqueID}`}>{label}</span>
	<button {disabled} role="switch" aria-checked={checked} on:click={handleClick} />
</div>

<style>
	:root {
		--accent-color: rgb(var(--global-color-primary-500));
		--size: 40px;
		--gray: #ccc;
	}

	.s--slider {
		display: flex;
		justify-content: flex-start;
		align-items: center;
	}

	.s--slider button {
		width: var(--size);
		height: calc(var(--size) * 0.55);
		position: relative;
		margin: 0;
		background: var(--gray);
		border: none;
	}

	.s--slider button::before {
		content: '';
		position: absolute;
		width: calc(var(--size) / 3);
		height: calc(var(--size) / 3);
		background: #fff;
		top: calc(var(--size) / 10);
		right: calc(var(--size) / 1.7);
		transition: transform 0.3s;
	}

	.s--slider button[aria-checked='true'] {
		background-color: var(--accent-color);
	}

	.s--slider button[aria-checked='true']::before {
		transform: translateX(1.3em);
		transition: transform 0.3s;
	}

	.s--slider button:focus {
		box-shadow: 0 0px 0px 1px var(--accent-color);
	}

	.s--slider button {
		border-radius: 1.5em;
	}

	.s--slider button::before {
		border-radius: 100%;
	}

	.s--slider button:focus {
		box-shadow: 0 0px 8px var(--accent-color);
		border-radius: 1.5em;
	}
</style>
