<!-- @component Agenda
`variant="grid"` draws large bordered cells and `dayAppendSnippet` puts the events of each day under its number. The title and the buttons are markup of the app that changes `visibleMonth` and `visibleYear`. -->
<script lang="ts">
	import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
	import { Button, Calendar, toISODate } from '#lib';

	type Tone = 'primary' | 'accent' | 'warning';

	const events: Record<string, { title: string; tone: Tone }[]> = {
		'2026-09-03': [{ title: 'Staff meeting', tone: 'primary' }],
		'2026-09-08': [{ title: 'Balayage course', tone: 'accent' }],
		'2026-09-11': [{ title: 'Inventory', tone: 'warning' }],
		'2026-09-17': [
			{ title: 'Bridal trial', tone: 'primary' },
			{ title: 'New colors', tone: 'accent' }
		],
		'2026-09-24': [
			{ title: '09:30 Luca R.', tone: 'primary' },
			{ title: '11:00 Giulia M.', tone: 'accent' }
		],
		'2026-09-29': [{ title: 'Closed', tone: 'warning' }]
	};

	let visibleMonth = $state(8);
	let visibleYear = $state(2026);
	let selectedDate = $state<Date>();

	const title = $derived(
		new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
			new Date(visibleYear, visibleMonth, 1)
		)
	);

	function move(step: number) {
		const date = new Date(visibleYear, visibleMonth + step, 1);
		visibleMonth = date.getMonth();
		visibleYear = date.getFullYear();
	}

	function goToday() {
		const today = new Date();
		visibleMonth = today.getMonth();
		visibleYear = today.getFullYear();
	}
</script>

<div class="agenda">
	<header>
		<h3>{title}</h3>
		<Button variant="secondary" size="sm" onclick={goToday}>Today</Button>
		<span class="arrows">
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={mdiChevronLeft}
				aria-label="Previous month"
				onclick={() => move(-1)}
			/>
			<Button
				buttonType="icon"
				variant="secondary"
				size="sm"
				icon={mdiChevronRight}
				aria-label="Next month"
				onclick={() => move(1)}
			/>
		</span>
	</header>
	<Calendar variant="grid" bind:visibleMonth bind:visibleYear bind:selectedDate aria-label={title}>
		{#snippet dayAppendSnippet({ date, outside })}
			{#if !outside}
				{#each events[toISODate(date)] ?? [] as event (event.title)}
					<span class="event" data-tone={event.tone}>{event.title}</span>
				{/each}
			{/if}
		{/snippet}
	</Calendar>
</div>

<style>
	.agenda {
		display: grid;
		gap: 14px;
	}

	header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	h3 {
		margin: 0;
		font-family: var(--global-font-family-display);
		font-size: 22px;
		letter-spacing: -0.03em;
	}

	.arrows {
		display: flex;
		gap: 6px;
		margin-inline-start: auto;
	}

	.event {
		--_tone: var(--global-color-primary);
		overflow: hidden;
		padding: 3px 6px;
		border-radius: var(--global-radius-xs);
		background: var(--global-color-primary-soft);
		color: var(--global-color-text);
		font-size: 11px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.event::before {
		content: '';
		display: inline-block;
		width: 6px;
		height: 6px;
		margin-inline-end: 6px;
		border-radius: 2px;
		background: var(--_tone);
		vertical-align: 1px;
	}

	.event[data-tone='accent'] {
		--_tone: var(--global-color-accent);
		background: var(--global-color-accent-soft);
	}

	.event[data-tone='warning'] {
		--_tone: var(--global-color-warning);
		background: var(--global-color-warning-soft);
	}
</style>
