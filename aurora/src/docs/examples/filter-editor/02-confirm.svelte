<!-- @component Cancel and Apply
With `confirm` changes stay in the card until Apply (or Enter); Apply is disabled while the value is incomplete. `removable` adds Remove for a condition that is already applied, `onclose` a close button. -->
<script lang="ts">
	import { mdiContentCut } from '@mdi/js';
	import { FilterEditor, filterCondition, type FilterField, type FilterCondition } from '#lib';

	const field: FilterField = {
		name: 'service',
		label: 'Service',
		icon: mdiContentCut,
		type: 'select',
		items: [
			{ value: 1, label: 'Cut' },
			{ value: 2, label: 'Color' },
			{ value: 3, label: 'Balayage' },
			{ value: 4, label: 'Blow-dry' }
		]
	};

	let condition = $state(filterCondition('service', 'in', [{ value: 3, label: 'Balayage' }]));
	let applied = $state<FilterCondition>();
	let message = $state('Nothing applied yet');

	function describe(item: FilterCondition) {
		const items = (item.value as { label: string }[] | undefined) ?? [];
		return `${item.operator === 'in' ? 'is' : 'is not'} ${items.map((entry) => entry.label).join(', ')}`;
	}
</script>

<div class="example">
	<div class="card">
		<FilterEditor
			{field}
			bind:condition
			confirm
			removable={!!applied}
			onapply={(next) => {
				applied = next;
				message = `Applied: ${field.label} ${describe(next)}`;
			}}
			oncancel={() => {
				condition = applied ?? filterCondition('service', 'in');
				message = 'Cancelled';
			}}
			onremove={() => {
				applied = undefined;
				condition = filterCondition('service', 'in');
				message = 'Removed';
			}}
			onclose={() => (message = 'Closed')}
		/>
	</div>
	<p>{message}</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: start;
		gap: 12px;
	}

	.card {
		border: var(--global-border-width) solid var(--global-color-border-strong);
		border-radius: var(--global-radius-xl);
		background: var(--global-color-surface-pop);
		box-shadow: var(--global-shadow-lg);
	}

	p {
		margin: 0;
		color: var(--global-color-text-2);
		font-size: 13px;
	}
</style>
