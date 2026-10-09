<!-- @component Sizes, colors and content
`size` and `variant` are the ones of `Button`, and the `--button-*` variables restyle the trigger. `valueSnippet` replaces the text of the selection, here with a colored dot from `data`; `itemLabelSnippet` does the same in the list. -->
<script lang="ts">
	import { Dropdown, type Item } from '#lib';

	const views: Item[] = [
		{ value: 'day', label: 'Day' },
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' }
	];

	const rooms: Item<{ color: string }>[] = [
		{ value: 'a', label: 'Room A', data: { color: '#3c70ce' } },
		{ value: 'b', label: 'Room B', data: { color: '#0e7a4f' } },
		{ value: 'c', label: 'Room C', data: { color: '#cf2f36' } }
	];

	let room: Item<{ color: string }>[] = $state([rooms[0]]);
</script>

<div class="demo">
	<Dropdown size="sm" items={views} values={[views[1]]} clearable={false} />
	<Dropdown items={views} values={[views[1]]} clearable={false} />
	<Dropdown size="lg" variant="primary" items={views} values={[views[1]]} clearable={false} />
	<Dropdown label="Room" items={rooms} bind:values={room} --button-border-radius="999px">
		{#snippet valueSnippet({ values, text })}
			<span class="room">
				{#if values[0]}<span class="dot" style:background={values[0].data?.color}></span>{/if}
				{text}
			</span>
		{/snippet}
		{#snippet itemLabelSnippet({ item })}
			<span class="room"><span class="dot" style:background={item.data?.color}></span>{item.label}</span>
		{/snippet}
	</Dropdown>
</div>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}

	.room {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
</style>
