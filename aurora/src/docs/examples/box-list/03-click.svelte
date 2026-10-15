<!-- @component Buttons
Without `href` and with `onboxClick` each box is a button; `onboxClick` receives the box and the event, and is called for links too. `disabled` turns a box off. Without `onboxClick` and `href` a box is a plain card. -->
<script lang="ts">
	import { BoxList, type BoxListItem } from '#lib';
	import { mdiDatabaseExportOutline, mdiDatabaseImportOutline, mdiDeleteSweepOutline } from '@mdi/js';

	const boxes: BoxListItem[] = [
		{ name: 'import', label: 'Import clients', description: 'From a CSV or Excel file', icon: mdiDatabaseImportOutline },
		{ name: 'export', label: 'Export clients', description: 'Download every client as CSV', icon: mdiDatabaseExportOutline, color: 4 },
		{ name: 'purge', label: 'Delete inactive clients', description: 'Only for administrators', icon: mdiDeleteSweepOutline, color: 6, disabled: true }
	];

	let last = $state('none');
</script>

<div class="demo">
	<BoxList {boxes} aria-label="Data tools" onboxClick={({ box }) => (last = box.label)} />
	<p>Last clicked: {last}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
		width: min(100%, 760px);
	}

	p {
		margin: 0;
	}
</style>
