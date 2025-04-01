<script lang="ts">
	import './Switch.css'

	interface Props {
		label: string;
		value?: boolean;
		disabled?: boolean;
		onchange?: (event: {
			detail: {
				label: string,
				value: boolean
			}
		}) => void
	}

	let {
		label = '',
		value = $bindable(undefined),
		disabled = false,
		onchange,
	}: Props = $props();


	let checked = $state(value)
	const uniqueID = Math.floor(Math.random() * 100)

	function handleClick(event: MouseEvent) {
		const target = (event.target as HTMLElement) || null

		const state = target.getAttribute('aria-checked')
		checked = state === 'true' ? false : true
		value = checked === true ? true : false

		if(onchange){
			onchange({
				detail: {
					label,
					value: checked
				}
			})
		}
	}
</script>

<div class="s s--slider">
	<span id={`switch-${uniqueID}`}>{label}</span>
	<button
		{disabled}
		role="switch"
		aria-checked={checked}
		onclick={handleClick}
		aria-label={`Switch for ${label}`}
	></button>
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
		font-size: var(
			--switch-font-size,
			var(--switch-default-font-size)
		);
		gap: var(
			--switch-gap,
			var(--switch-default-gap)
		);
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
	span {
		width: var(
			--switch-label-width,
			var(--switch-default-label-width)
		);
	}
</style>
