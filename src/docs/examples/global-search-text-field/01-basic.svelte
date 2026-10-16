<!-- @component Search
Click the field or press Ctrl+K (⌘K on a Mac). `searcher` receives the text and an abort `signal`; results with `href` are links, and `group` puts them under a title. Try "giu" or "agenda". -->
<script lang="ts">
	import { GlobalSearchTextField, type GlobalSearchItem } from '#lib';
	import { mdiAccountOutline, mdiCalendarOutline, mdiCogOutline } from '@mdi/js';

	const everything: GlobalSearchItem[] = [
		{ value: 'c1', label: 'Giulia Marini', description: '+39 333 812 4410 · Milano', icon: mdiAccountOutline, group: 'Clients', href: '#giulia' },
		{ value: 'c2', label: 'Giuseppe Verdi', description: 'Last visit 12 Aug', icon: mdiAccountOutline, group: 'Clients', href: '#giuseppe' },
		{ value: 'c3', label: 'Sara Bianchi', description: 'Last visit 3 Sep', icon: mdiAccountOutline, group: 'Clients', href: '#sara' },
		{ value: 'p1', label: 'Agenda · June', description: '/agenda/2026-06', icon: mdiCalendarOutline, group: 'Pages', href: '#agenda-june' },
		{ value: 'p2', label: 'Agenda · September', description: '/agenda/2026-09', icon: mdiCalendarOutline, group: 'Pages', href: '#agenda-september' },
		{ value: 'p3', label: 'Settings', description: '/settings', icon: mdiCogOutline, group: 'Pages', href: '#settings' }
	];

	async function searcher({ searchText, signal }: { searchText: string; signal: AbortSignal }) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		signal.throwIfAborted();
		const text = searchText.toLowerCase();
		return everything.filter((item) => item.label.toLowerCase().includes(text));
	}

	let chosen = $state('');
</script>

<div class="demo">
	<GlobalSearchTextField {searcher} onselect={({ item }) => (chosen = item.label)} />
	<p>Last chosen: {chosen || 'none'}</p>
</div>

<style>
	.demo {
		display: grid;
		gap: 12px;
	}

	p {
		margin: 0;
	}
</style>
