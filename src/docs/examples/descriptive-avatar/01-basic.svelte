<!-- @component Title and subtitle
The avatar takes its initials and color from the title. `direction="column"` stacks the avatar over the centered texts; `reverse` puts it at the end. Long texts are cut with an ellipsis. -->
<script lang="ts">
	import { DescriptiveAvatar } from '#lib';
</script>

<div class="demo">
	<DescriptiveAvatar title="Giulia Marini" subtitle="Senior Colorist" status="online" />
	<DescriptiveAvatar title="Sara Bianchi" subtitle="Stylist" direction="column" size="lg" />
	<DescriptiveAvatar title="Mario Rossi" subtitle="mario.rossi@example.com" reverse />
	<div class="narrow">
		<DescriptiveAvatar title="Alessandra Bartolomei Montecchi" subtitle="Head of the northern region stores" />
	</div>
</div>

<style>
	.demo {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 32px;
	}

	.narrow {
		width: 200px;
	}
</style>
