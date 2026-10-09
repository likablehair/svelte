<!-- @component Mobile drawer
With `mobileDrawer`, on screens up to 1024px wide the list opens in a bottom drawer instead of a menu: it has its own search field at the top, larger rows and the label as title. Narrow the window or open this page on a phone to try it. -->
<script lang="ts">
	import { Autocomplete, type Item } from '#lib';

	const cities: Item[] = [
		'Bergamo',
		'Bologna',
		'Brescia',
		'Firenze',
		'Genova',
		'Milano',
		'Napoli',
		'Padova',
		'Roma',
		'Torino',
		'Venezia',
		'Verona'
	].map((city) => ({ value: city, label: city }));
</script>

<div class="demo">
	<Autocomplete label="Branches" placeholder="Search a city…" items={cities} multiple mobileDrawer />
</div>

<style>
	.demo {
		width: 100%;
		max-width: 340px;
	}
</style>
