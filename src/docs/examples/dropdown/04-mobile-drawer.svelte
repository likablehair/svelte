<!-- @component Mobile drawer
With `mobileDrawer`, on screens up to 1024px wide the list opens in a bottom drawer, with bigger rows and no search field; on wider screens it stays a menu. Resize the window to try it. -->
<script lang="ts">
	import { Dropdown, type Item } from '#lib';

	const operators: Item[] = [
		'Luca Rossi',
		'Giulia Marini',
		'Sara Bianchi',
		'Marco Conti',
		'Elena Greco',
		'Paolo Ricci',
		'Chiara Bruno',
		'Davide Gallo'
	].map((name) => ({ value: name.toLowerCase().replace(' ', '-'), label: name }));
</script>

<Dropdown label="Operator" placeholder="Anyone" items={operators} mobileDrawer />
