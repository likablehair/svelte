<!-- @component Empty page
The full illustration, for a page or a panel with nothing to show yet. `icon` takes an SVG path; `children` holds the actions. -->
<script lang="ts">
	import { mdiCalendarBlankOutline, mdiPlus } from '@mdi/js';
	import { Button, NoData } from '#lib';
</script>

<NoData
	icon={mdiCalendarBlankOutline}
	title="No appointments"
	description="The day is free. Add an appointment or share your booking link."
>
	<Button size="sm" icon={mdiPlus}>New appointment</Button>
</NoData>
