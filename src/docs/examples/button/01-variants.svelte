<!-- @component Variants
The three shapes (`buttonType`), the four color variants (`variant`), states and sizes (`size`). -->
<script lang="ts">
	import {
		mdiArrowRight,
		mdiDotsHorizontal,
		mdiHeartOutline,
		mdiPencilOutline,
		mdiPlus,
		mdiTrashCanOutline,
		mdiTrayArrowDown
	} from '@mdi/js';
	import { Button, Icon } from '#lib';
</script>

<div class="rows">
	<div class="row">
		<Button icon={mdiPlus}>New client</Button>
		<Button variant="gradient">Save and publish</Button>
		<Button variant="secondary" icon={mdiTrayArrowDown}>Export</Button>
		<Button variant="danger" icon={mdiTrashCanOutline}>Delete</Button>
	</div>
	<div class="row">
		<Button buttonType="text">Cancel</Button>
		<Button buttonType="text" icon={mdiPencilOutline}>Edit</Button>
		<Button buttonType="icon" variant="secondary" icon={mdiDotsHorizontal} aria-label="More" />
		<Button buttonType="icon" variant="secondary" icon={mdiHeartOutline} aria-label="Favorite" />
		<Button buttonType="icon" variant="gradient" icon={mdiPlus} aria-label="Add" />
	</div>
	<div class="row">
		<Button loading>Loading…</Button>
		<Button disabled>Disabled</Button>
		<Button size="sm">Small</Button>
		<Button size="lg">Large <Icon path={mdiArrowRight} /></Button>
	</div>
</div>

<style>
	.rows {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
</style>
