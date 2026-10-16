<!-- @component 12-hour and 24-hour clock
`locale` chooses the clock (`it`, `en-GB` and most of Europe are 24-hour, `en` is 12-hour) and the names of AM and PM; `hour12` forces one. The value is 24-hour in both. `locale` also names the columns for screen readers ("Ore", "Minuti"); `hoursLabel`, `minutesLabel` and `periodLabel` change them. -->
<script lang="ts">
	import { TimePicker } from '#lib';

	let value = $state<string | undefined>('18:45');
</script>

<div class="example">
	<figure>
		<TimePicker bind:value locale="it" aria-label="Orario" />
		<figcaption>locale="it"</figcaption>
	</figure>
	<figure>
		<TimePicker bind:value locale="it" hour12 aria-label="Orario (12 ore)" />
		<figcaption>locale="it" hour12</figcaption>
	</figure>
	<p>Value: {value ?? 'none'}</p>
</div>

<style>
	.example {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 16px;
	}

	figure {
		display: grid;
		justify-items: start;
		gap: 8px;
		margin: 0;
	}

	figcaption {
		color: var(--global-color-text-3);
		font-family: var(--global-font-family-mono);
		font-size: 12px;
	}

	p {
		flex-basis: 100%;
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
