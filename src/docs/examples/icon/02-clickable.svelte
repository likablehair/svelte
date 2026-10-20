<!-- @component Clickable icon
Icon is only an image. For a clickable icon use `Button` with `buttonType="text"`: focus, keyboard, hover and `disabled` work correctly. Without text it needs an `aria-label`. -->
<script lang="ts">
	import { mdiClose, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
	import { Button } from '#lib';
</script>

<Button buttonType="text" variant="secondary" icon={mdiClose} aria-label="Close" />
<Button buttonType="text" icon={mdiPencilOutline} aria-label="Edit" />
<Button buttonType="text" variant="danger" icon={mdiTrashCanOutline} aria-label="Delete" />
<Button buttonType="text" variant="secondary" size="sm" icon={mdiClose} aria-label="Close" disabled />
