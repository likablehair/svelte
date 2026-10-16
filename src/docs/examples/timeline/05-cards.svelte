<!-- @component Cards, aside and actions
`variant="card"` puts the content of each item in a card. `asideSnippet` sits next to the title, on the far side; `appendSnippet` goes under the description, for actions or details. -->
<script lang="ts">
	import { mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
	import { Button, Chip, Timeline, type TimelineItem } from '#lib';

	type Payment = { amount: number; state: 'paid' | 'due' };

	const items: TimelineItem<Payment>[] = [
		{
			title: 'Deposit',
			description: 'Bank transfer',
			from: new Date(2026, 8, 3),
			data: { amount: 1200, state: 'paid' }
		},
		{
			title: 'Second installment',
			description: 'Card ending 4242',
			from: new Date(2026, 8, 17),
			data: { amount: 800, state: 'paid' }
		},
		{ title: 'Balance', from: new Date(2026, 9, 1), data: { amount: 450, state: 'due' } }
	];

	const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
</script>

<div class="demo">
	<Timeline {items} variant="card" locale="en-GB">
		{#snippet asideSnippet({ item })}
			<span class="amount">{euro.format(item.data?.amount ?? 0)}</span>
		{/snippet}
		{#snippet appendSnippet({ item })}
			<div class="actions">
				<Chip variant={item.data?.state === 'paid' ? 'success' : 'warning'}>
					{item.data?.state === 'paid' ? 'Paid' : 'Due'}
				</Chip>
				<Button buttonType="text" size="sm" icon={mdiPencilOutline}>Edit</Button>
				<Button buttonType="text" size="sm" variant="danger" icon={mdiTrashCanOutline}>Delete</Button>
			</div>
		{/snippet}
	</Timeline>
</div>

<style>
	.demo {
		width: min(100%, 480px);
	}

	.amount {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
	}
</style>
