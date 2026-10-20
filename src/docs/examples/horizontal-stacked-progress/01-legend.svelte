<!-- @component Legend and total
Each entry takes its share of the bar; colors come from the data palette. With `total` the part not taken by the entries stays empty and `showValue` shows how much is taken. Hover a segment to see its value. -->
<script lang="ts">
	import { HorizontalStackedProgress } from '#lib';

	const bookings = [
		{ label: 'Colour', value: 44, valueLabel: '44%' },
		{ label: 'Cut', value: 24, valueLabel: '24%' },
		{ label: 'Treatments', value: 18, valueLabel: '18%' }
	];
</script>

<div class="box">
	<HorizontalStackedProgress progresses={bookings} total={100} label="Agenda occupancy" showValue />
</div>

<style>
	.box {
		width: min(100%, 420px);
	}
</style>
