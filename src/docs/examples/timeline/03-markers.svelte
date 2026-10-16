<!-- @component Icons and colors
`icon` puts an SVG path in the marker, which grows to fit it; `variant` colors it (`success`, `warning`, `error`, `neutral`). They combine with `status`: a done or current marker is filled. -->
<script lang="ts">
	import {
		mdiAlertCircleOutline,
		mdiCheck,
		mdiCreditCardOutline,
		mdiHomeOutline,
		mdiPackageVariantClosed,
		mdiTruckDeliveryOutline
	} from '@mdi/js';
	import { Timeline, type TimelineItem } from '#lib';

	const items: TimelineItem[] = [
		{ title: 'Order placed', from: new Date(2026, 8, 21, 18, 12), icon: mdiCheck, status: 'done' },
		{
			title: 'Payment confirmed',
			from: new Date(2026, 8, 21, 18, 13),
			icon: mdiCreditCardOutline,
			variant: 'success',
			status: 'done'
		},
		{
			title: 'Packed',
			from: new Date(2026, 8, 22, 11, 40),
			icon: mdiPackageVariantClosed,
			status: 'done'
		},
		{
			title: 'Delivery delayed',
			description: 'The courier missed the pickup; new estimate tomorrow.',
			from: new Date(2026, 8, 23, 9, 5),
			icon: mdiAlertCircleOutline,
			variant: 'warning',
			status: 'done'
		},
		{
			title: 'Out for delivery',
			from: new Date(2026, 8, 24, 8, 30),
			icon: mdiTruckDeliveryOutline,
			status: 'current'
		},
		{ title: 'Delivered', icon: mdiHomeOutline, variant: 'neutral', status: 'upcoming' }
	];
</script>

<div class="demo">
	<Timeline {items} locale="en-GB" />
</div>

<style>
	.demo {
		width: min(100%, 420px);
	}
</style>
