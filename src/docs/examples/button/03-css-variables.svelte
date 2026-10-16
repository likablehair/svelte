<!-- @component Per-instance CSS variables
Every visual property can be changed on a single instance with a `--button-*` style prop. -->
<script lang="ts">
	import { Button } from '#lib';
</script>

<Button --button-border-radius="999px" --button-padding="0 22px">Pill</Button>
<Button variant="secondary" --button-width="200px">200px wide</Button>
<Button
	--button-background="var(--global-color-success)"
	--button-hover-background="var(--global-color-success)"
	--button-color="var(--global-color-on-success)"
>
	Success
</Button>
