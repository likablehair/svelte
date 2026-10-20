<!-- @component Sizes and states
`size` follows the buttons, so the dropdown lines up with them in a toolbar. `disabled` blocks it, `clearable` swaps the arrow for a clear button while something is chosen. The tiles take the `--icons-dropdown-*` variables, here the background of the chosen one. -->
<script lang="ts">
	import { mdiFormatAlignCenter, mdiFormatAlignLeft, mdiFormatAlignRight } from '@mdi/js';
	import { IconsDropdown, type IconItem } from '#lib';

	const alignments: IconItem[] = [
		{ value: 'left', label: 'Align left', icon: mdiFormatAlignLeft },
		{ value: 'center', label: 'Center', icon: mdiFormatAlignCenter },
		{ value: 'right', label: 'Align right', icon: mdiFormatAlignRight }
	];
</script>

<div class="demo">
	<IconsDropdown label="Small" size="sm" items={alignments} values={[alignments[0]]} />
	<IconsDropdown label="Medium" items={alignments} values={[alignments[1]]} />
	<IconsDropdown label="Large" size="lg" items={alignments} values={[alignments[2]]} />
	<IconsDropdown label="Disabled" items={alignments} values={[alignments[0]]} disabled />
	<IconsDropdown label="Clearable" items={alignments} values={[alignments[1]]} clearable />
	<IconsDropdown
		label="Custom"
		items={alignments}
		values={[alignments[2]]}
		--icons-dropdown-value-background="var(--global-color-accent)"
	/>
</div>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
</style>
