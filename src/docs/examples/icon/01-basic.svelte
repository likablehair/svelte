<!-- @component Basic
The icon takes an SVG path (24×24 viewBox), for example from `@mdi/js`. It inherits color and size from the surrounding text; without `title` it is decorative. -->
<script lang="ts">
	import { mdiCalendarOutline, mdiHeart, mdiMagnify } from '@mdi/js';
	import { Icon } from '#lib';
</script>

<Icon path={mdiMagnify} />
<Icon path={mdiCalendarOutline} --icon-size="32px" />
<Icon path={mdiHeart} title="Favorite" --icon-size="32px" --icon-color="var(--global-color-error)" />
