<script lang="ts">
	export let color = 'rgb(var(--global-background-color-500))',
		weight = '1px',
		radius = '0.5px',
		marginTop: string | undefined = '10px',
		marginBottom: string | undefined = '10px',
		marginLeft: string | undefined = '5px',
		marginRight: string | undefined = '5px'
</script>

<div
	style:background-color={color}
	style:border-radius={radius}
	style:height={weight}
	style:margin-top={marginTop}
	style:margin-bottom={marginBottom}
	style:margin-right={marginRight}
	style:margin-left={marginLeft}
/>
